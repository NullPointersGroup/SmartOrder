import os

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_openai import ChatOpenAI

from src.chat.LLMModels import LLMRequest, LLMResponse, Message, MetaData
from src.chat.ToolExecutor import ToolExecutor
from src.chat.prompt import cart_prompt


class LLMAgent:
    def __init__(self, tool_executor: ToolExecutor) -> None:
        self.tool_executor: ToolExecutor = tool_executor
        self.model: ChatOpenAI = ChatOpenAI(
            model="gpt-5.4-mini",
            api_key=os.getenv("OPENAI_API_KEY"),
            tools=list(tool_executor._tools),
        )

    def invoke(self, request: LLMRequest) -> LLMResponse:
        langchain_messages = [SystemMessage(content=cart_prompt)]

        for msg in request.chat_history:
            if msg.role == "user":
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.role in ("assistant", "tool"):
                langchain_messages.append(AIMessage(content=msg.content))

        response: AIMessage = self.model.invoke(langchain_messages)

        tool_call_names: list[str] = []
        while hasattr(response, "tool_calls") and response.tool_calls:
            langchain_messages.append(response) 

            for tc in response.tool_calls:
                tool_name: str = tc["name"]
                tool_args: dict = tc["args"]
                tool_call_names.append(tool_name)

                tool_result = self.tool_executor.execute(tool_name, tool_args)
                langchain_messages.append(
                    ToolMessage(content=str(tool_result), tool_call_id=tc["id"])
                )

            response = self.model.invoke(langchain_messages)

        metadata: list[MetaData] = []
        if hasattr(response, "response_metadata") and response.response_metadata:
            usage = response.response_metadata.get("token_usage", {})
            metadata.append(
                MetaData(
                    model=response.response_metadata.get("model_name", ""),
                    total_tokens=usage.get("total_tokens", 0),
                    prompt_tokens=usage.get("prompt_tokens", 0),
                    completion_tokens=usage.get("completion_tokens", 0),
                )
            )

        return LLMResponse(
            content=response.content,
            tool_calls=tool_call_names,
            metadata=metadata,
        )