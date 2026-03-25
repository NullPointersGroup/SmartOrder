from abc import ABC, abstractmethod

from src.chat.ChatSchemas import Message


class LLMPort(ABC):
    @abstractmethod
    ## Message o str come tipo di ritorno?
    def invoke_agent(self, prompt: str) -> str:
        pass
