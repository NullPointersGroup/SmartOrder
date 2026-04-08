from abc import ABC, abstractmethod

from src.chat.LLMModels import LLMRequest, LLMResponse


class LLMPort(ABC):
    @abstractmethod
    def invoke(self, request: LLMRequest) -> LLMResponse:
        raise NotImplementedError
