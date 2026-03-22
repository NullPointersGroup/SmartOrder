from abc import ABC, abstractmethod
from src.chat.ChatSchemas import Message
from src.chat.enums import SenderEnum


class ChatRepoPort(ABC):
    @abstractmethod
    def get_messages(self, conv_id: int) -> list[Message]:
        pass

    @abstractmethod
    def add_message(self, conv_id: int, text: str, sender: SenderEnum) -> Message:
        pass
