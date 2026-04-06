from src.chat.LLMModels import LLMRequest, LLMResponse
from src.chat.ports.LLMPort import LLMPort


class ConcreteLLM(LLMPort):
    def invoke(self, request: LLMRequest) -> LLMResponse:
        return LLMResponse(content=f"invoke called with message_id: {request.message_id}")


def test_llm_port_can_be_implemented():
    llm = ConcreteLLM()
    request = LLMRequest(conversation_id=1, message_id=10, chat_history=[])
    result = llm.invoke(request)
    assert result.content == "invoke called with message_id: 10"


def test_invoke_delegates_to_invoke():
    llm = ConcreteLLM()
    request = LLMRequest(conversation_id=2, message_id=20, chat_history=[])
    result = llm.invoke(request)
    assert isinstance(result, LLMResponse)
    assert result.content == "invoke called with message_id: 20"
