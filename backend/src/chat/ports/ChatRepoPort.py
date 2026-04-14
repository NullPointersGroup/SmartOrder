from abc import ABC, abstractmethod
from src.chat.ChatSchemas import Message
from src.db.models import Conversations
from src.enums import SenderEnum


class ChatRepoPort(ABC):
    @abstractmethod
    def get_messages(self, conv_id: int) -> list[Message]:
        pass

    @abstractmethod
    def get_chat_history(self, conv_id: int, max_messages: int = 20) -> list[Message]:
        pass

    @abstractmethod
    def add_message(self, conv_id: int, text: str, sender: SenderEnum) -> Message:
        pass

    @abstractmethod
    def create_conversation(self, username: str) -> Conversations:
        pass

    @abstractmethod
    def conversation_exist(self, conv_id: int) -> bool:
        pass
