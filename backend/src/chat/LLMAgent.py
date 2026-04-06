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
from src.chat.LLMModels import LLMRequest, LLMResponse, MetaData, UserPreference
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
        system_message = SystemMessage(content=cart_prompt + self._build_user_pref_block(request.user_preferences))
        messages = [system_message, *self.build_history(request)]
        response = self._run_agentic_loop(messages)
        return self._build_response(response)


    def _build_user_pref_block(self, preferences: list[UserPreference] | None) -> str:
        if not preferences:
            return ""

        lines = []
        habitual_count = 0
        for pref in preferences:
            flag = " [ABITUDINE FORTE]" if pref.is_habitual else ""
            if pref.is_habitual:
                habitual_count += 1
            lines.append(f"- {pref.prod_id} - {pref.prod_name} (acquistato {pref.frequency} volte){flag}")

        if habitual_count > 1:
            tie_rule = (
                "\nRegola decisionale: sono presenti piu prodotti con ABITUDINE FORTE; "
                "non scegliere automaticamente e chiedi disambiguazione."
            )
        else:
            tie_rule = (
                "\nRegola decisionale: se i prodotti storici rilevanti sono piu di uno, "
                "non scegliere automaticamente; chiedi sempre disambiguazione mostrando prima i prodotti storici. "
                "Se il prodotto storico e uno solo e marcato ABITUDINE FORTE, puoi usarlo come scelta principale."
            )

        return "\n\nPreferenze storiche utente:\n" + "\n".join(lines) + tie_rule


    def build_history(self, request: LLMRequest) -> list[BaseMessage]:
        messages: list[BaseMessage] = []
        for msg in request.chat_history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))
            elif msg.role == "tool":
                messages.append(ToolMessage(content=msg.content, tool_call_id=f"history-{request.message_id}"))
        return messages

    def _run_agentic_loop(self, messages: list[BaseMessage]) -> tuple[AIMessage, list[str]]:
        tool_call_names: list[str] = []
        response: AIMessage = self.runnable.invoke(messages)

        while hasattr(response, "tool_calls") and response.tool_calls:
            messages.append(response)
            for tc in response.tool_calls:
                tool_call_names.append(tc["name"])
                result = self.tool_executor.execute(tc["name"], tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            response = self.runnable.invoke(messages)

        return response, tool_call_names


    def _build_response(self, result: tuple[AIMessage, list[str]]) -> LLMResponse:
        response, tool_call_names = result
        usage = getattr(response, "usage_metadata", None) or {}
        response_metadata = getattr(response, "response_metadata", None) or {}

        metadata = []
        if usage or response_metadata:
            metadata.append(MetaData(
                model=response_metadata.get("model_name", ""),
                total_tokens=usage.get("total_tokens", 0),
                prompt_tokens=usage.get("input_tokens", usage.get("prompt_tokens", 0)),
                completion_tokens=usage.get("output_tokens", usage.get("completion_tokens", 0)),
            ))

        return LLMResponse(
            content=self.normalize_content(response.content),
            tool_calls=tool_call_names,
            metadata=metadata,
        )