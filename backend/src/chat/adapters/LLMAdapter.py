from src.chat.LLMAgent import LLMAgent
from src.chat.ports.LLMPort import LLMPort
from src.chat.LLMModels import LLMRequest, LLMResponse 
 
class LLMAdapter(LLMPort):
    def __init__(self, agent: LLMAgent) -> None:
        self.agent: LLMAgent = agent
 
    def invoke_agent(self, request: LLMRequest) -> LLMResponse:
        return self.agent.invoke(request)