from abc import ABC, abstractmethod

from src.chat.ChatSchemas import Message
from src.chat.LLMModels import LLMRequest, LLMResponse


class LLMPort(ABC):
    @abstractmethod
    def invoke_agent(self, request: LLMRequest) -> LLMResponse:
        pass
