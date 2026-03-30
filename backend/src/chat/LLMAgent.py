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
            model="gpt-5.4-mini", api_key=SecretStr(os.getenv("OPENAI_API_KEY") or "")
        )
        self.runnable = self.model.bind_tools(self.tool_executor.tools)

    @staticmethod
    # def _normalize_content(content: str | list[str | dict[str, Any]] | None) -> str:
    # if isinstance(content, str):
    #    return content
    # if not content:
    #    return ""
    # parts: list[str] = []
    # for item in content:
    #     if isinstance(item, str):
    #         parts.append(item)
    #     elif isinstance(item, dict) and item.get("type") == "text":
    #         text = item.get("text")
    #         if isinstance(text, str):
    #             parts.append(text)
    #    return str(content[-1]).strip()
    def _normalize_content(content: str | list[str | dict[str, Any]] | None) -> str:
        # if isinstance(content, str):
        #     return content.strip()
        # if not content:
        #     return ""

        if isinstance(content, str):
            # Rimuove eventuali strutture JSON all'inizio o nel testo
            text = re.sub(r"\{.*?\}.*?\n?", "", content, flags=re.DOTALL)
            return text.strip()

        if not content:
            return ""

        text = str(content)
        # Rimuove blocchi JSON tipo {"chiave":"valore"}
        clean_text = re.sub(r"\{.*?\}.*?\n?", "", text).strip()
        return clean_text

        # for item in reversed(content):
        #     if isinstance(item, dict) and item.get("type") == "text":
        #         text = item.get("text")
        #         if isinstance(text, str):
        #             return text.strip()

        # return ""

    def invoke(self, request: LLMRequest) -> LLMResponse:
        langchain_messages: list[BaseMessage] = [SystemMessage(content=cart_prompt)]

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
            content=self._normalize_content(response.content),
            tool_calls=tool_call_names,
            metadata=metadata,
        )
