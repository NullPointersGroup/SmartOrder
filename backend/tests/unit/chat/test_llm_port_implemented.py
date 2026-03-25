from src.chat.ports.LLMPort import LLMPort

class ConcreteLLM(LLMPort):
    def invoke_agent(self, prompt: str) -> str:
        return f"invoke_agent called with prompt: {prompt}" 


def test_llm_port_can_be_implemented():
    llm = ConcreteLLM()
    prompt = "Hello"
    result = llm.invoke_agent(prompt)
    assert result == f"invoke_agent called with prompt: {prompt}"

def test_invoke_agent_returns_string():
    llm = ConcreteLLM()
    result = llm.invoke_agent("Test prompt")
    assert isinstance(result, str)
