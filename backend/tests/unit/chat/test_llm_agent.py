from types import SimpleNamespace

import pytest
pytest.importorskip("langchain_core")

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage

from src.chat.LLMAgent import LLMAgent
from src.chat.LLMModels import LLMRequest, Message
from src.chat.ToolExecutor import ToolExecutor


class FakeRunnable:
    def __init__(self, responses: list[object]) -> None:
        self._responses = responses
        self.calls: list[list[object]] = []

    def invoke(self, messages: list[object]) -> object:
        self.calls.append(messages.copy())
        return self._responses.pop(0)


class FakeChatOpenAI:
    def __init__(self, *args, **kwargs) -> None:
        self.args = args
        self.kwargs = kwargs
        self.bound_tools = None
        self.runnable = FakeRunnable([])

    def bind_tools(self, tools: list[object]) -> FakeRunnable:
        self.bound_tools = tools
        return self.runnable


class FakeTool:
    def __init__(self, name: str, result: str) -> None:
        self.name = name
        self.result = result
        self.calls: list[dict] = []

    def invoke(self, args: dict) -> str:
        self.calls.append(args)
        return self.result

#TU-B_220
def test_llm_agent_builds_messages_from_history(monkeypatch):
    fake_model = FakeChatOpenAI()
    fake_model.runnable = FakeRunnable(
        [
            SimpleNamespace(
                content="Risposta finale",
                tool_calls=[],
                response_metadata={},
                usage_metadata={},
            )
        ]
    )
    monkeypatch.setattr("src.chat.LLMAgent.ChatOpenAI", lambda *args, **kwargs: fake_model)
    agent = LLMAgent(tool_executor=ToolExecutor(tools=[]))
    request = LLMRequest(
        conversation_id=7,
        message_id=9,
        chat_history=[
            Message(role="user", content="ciao"),
            Message(role="assistant", content="salve"),
            Message(role="tool", content="[]"),
        ],
    )

    result = agent.invoke(request)
    first_call = fake_model.runnable.calls[0]

    assert result.content == "Risposta finale"
    assert isinstance(first_call[0], SystemMessage)
    assert isinstance(first_call[1], HumanMessage)
    assert first_call[1].content == "ciao"
    assert isinstance(first_call[2], AIMessage)
    assert first_call[2].content == "salve"
    assert isinstance(first_call[3], ToolMessage)
    assert first_call[3].content == "[]"

#TU-B_221
def test_llm_agent_executes_tool_calls_and_collects_metadata(monkeypatch):
    fake_tool = FakeTool(name="search", result="tool-output")
    fake_model = FakeChatOpenAI()
    fake_model.runnable = FakeRunnable(
        [
            SimpleNamespace(
                content="",
                tool_calls=[{"id": "call-1", "name": "search", "args": {"query": "olio"}}],
                response_metadata={},
                usage_metadata={},
            ),
            SimpleNamespace(
                content=[{"type": "text", "text": "Prodotto aggiunto"}],
                tool_calls=[],
                response_metadata={"model_name": "fake-model"},
                usage_metadata={"total_tokens": 10, "input_tokens": 6, "output_tokens": 4},
            ),
        ]
    )
    monkeypatch.setattr("src.chat.LLMAgent.ChatOpenAI", lambda *args, **kwargs: fake_model)
    agent = LLMAgent(tool_executor=ToolExecutor(tools=[fake_tool]))
    request = LLMRequest(
        conversation_id=1,
        message_id=3,
        chat_history=[Message(role="user", content="aggiungi olio")],
    )

    result = agent.invoke(request)
    second_call = fake_model.runnable.calls[1]

    assert fake_model.bound_tools == [fake_tool]
    assert fake_tool.calls == [{"query": "olio"}]
    assert result.content == "Prodotto aggiunto"
    assert result.tool_calls == ["search"]
    assert len(result.metadata) == 1
    assert result.metadata[0].model == "fake-model"
    assert result.metadata[0].total_tokens == 10
    assert isinstance(second_call[-1], ToolMessage)
    assert second_call[-1].content == "tool-output"

#TU-B_222
def test_normalize_content_returns_empty_string_for_missing_content(monkeypatch):
    fake_model = FakeChatOpenAI()
    fake_model.runnable = FakeRunnable(
        [
            SimpleNamespace(
                content=None,
                tool_calls=[],
                response_metadata={},
                usage_metadata={},
            )
        ]
    )
    monkeypatch.setattr("src.chat.LLMAgent.ChatOpenAI", lambda *args, **kwargs: fake_model)
    agent = LLMAgent(tool_executor=ToolExecutor(tools=[]))

    result = agent.invoke(LLMRequest(conversation_id=1, message_id=1, chat_history=[]))

    assert result.content == ""
