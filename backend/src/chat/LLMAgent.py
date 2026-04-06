import os
import re
from typing import Any

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_openai import ChatOpenAI
from pydantic import SecretStr
from src.chat.LLMModels import LLMRequest, LLMResponse, MetaData
from src.chat.prompt import cart_prompt
from src.chat.ToolExecutor import ToolExecutor


class LLMAgent:
    def __init__(self, tool_executor: ToolExecutor) -> None:
        self.tool_executor: ToolExecutor = tool_executor
        self.model: ChatOpenAI = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-5-mini"), api_key=SecretStr(os.getenv("OPENAI_API_KEY") or "")
        )
        self.runnable = self.model.bind_tools(self.tool_executor.tools)
        
    REGEX = r"\{.*?\}[^\n]*\n?"
    
    @staticmethod
    def clean(text: str) -> str:
        return re.sub(LLMAgent.REGEX, "", text, flags=re.DOTALL).strip()

    @staticmethod
    def normalize_content(content: str | list[str | dict[str, Any]] | None) -> str:
        if isinstance(content, str):
            return LLMAgent.clean(content)

        if not content:
            return ""

        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                cleaned = LLMAgent.clean(item)
            elif isinstance(item, dict) and item.get("type") == "text":
                cleaned = LLMAgent.clean(item.get("text") or "")
            else:
                continue

            if cleaned:
                parts.append(cleaned)

        return "\n".join(parts).strip()
    
    def invoke(self, request: LLMRequest) -> LLMResponse:
        user_pref_block = ""
        if request.user_preferences:
            preference_lines: list[str] = []
            habitual_count = 0
            for pref in request.user_preferences:
                habitual_flag = " [ABITUDINE FORTE]" if pref.is_habitual else ""
                if pref.is_habitual:
                    habitual_count += 1
                preference_lines.append(
                    f"- {pref.prod_id} - {pref.prod_name} (acquistato {pref.frequency} volte){habitual_flag}"
                )
            tie_rule = (
                "\nRegola decisionale: se i prodotti storici rilevanti sono piu di uno, "
                + "non scegliere automaticamente; chiedi sempre disambiguazione mostrando prima i prodotti storici. "
                + "Se il prodotto storico e uno solo e marcato ABITUDINE FORTE, puoi usarlo come scelta principale."
            )
            if habitual_count > 1:
                tie_rule = (
                    "\nRegola decisionale: sono presenti piu prodotti con ABITUDINE FORTE; "
                    + "non scegliere automaticamente e chiedi disambiguazione."
                )
            user_pref_block = (
                "\n\nPreferenze storiche utente:\n"
                + "\n".join(preference_lines)
                + tie_rule
            )

        langchain_messages: list[BaseMessage] = [SystemMessage(content=cart_prompt + user_pref_block)]

        for msg in request.chat_history:
            if msg.role == "user":
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                langchain_messages.append(AIMessage(content=msg.content))
            elif msg.role == "tool":
                langchain_messages.append(
                    ToolMessage(
                        content=msg.content,
                        tool_call_id=f"history-{request.message_id}",
                    )
                )

        response: AIMessage = self.runnable.invoke(langchain_messages)

        tool_call_names: list[str] = []
        while hasattr(response, "tool_calls") and response.tool_calls:
            langchain_messages.append(response)

            for tc in response.tool_calls:
                tool_name: str = tc["name"]
                tool_args: dict[str, Any] = tc["args"]
                tool_call_names.append(tool_name)

                tool_result = self.tool_executor.execute(tool_name, tool_args)
                langchain_messages.append(
                    ToolMessage(content=str(tool_result), tool_call_id=tc["id"])
                )

            response = self.runnable.invoke(langchain_messages)

        metadata: list[MetaData] = []
        usage = getattr(response, "usage_metadata", None) or {}
        response_metadata = getattr(response, "response_metadata", None) or {}
        if usage or response_metadata:
            metadata.append(
                MetaData(
                    model=response_metadata.get("model_name", ""),
                    total_tokens=usage.get("total_tokens", 0),
                    prompt_tokens=usage.get(
                        "input_tokens", usage.get("prompt_tokens", 0)
                    ),
                    completion_tokens=usage.get(
                        "output_tokens", usage.get("completion_tokens", 0)
                    ),
                )
            )

        return LLMResponse(
            content=self.normalize_content(response.content),
            tool_calls=tool_call_names,
            metadata=metadata,
        )
