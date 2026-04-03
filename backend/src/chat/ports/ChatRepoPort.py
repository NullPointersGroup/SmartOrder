from abc import ABC, abstractmethod
from src.chat.ChatSchemas import Message
from src.db.models import Conversazioni
from src.enums import SenderEnum


class ChatRepoPort(ABC):
    @abstractmethod
    def get_messages(self, conv_id: int) -> list[Message]:
        pass

    @abstractmethod
    def add_message(self, conv_id: int, text: str, sender: SenderEnum) -> Message:
        pass

    ## TODO create_conversation deve ritornare Conversation (tipo di dominio)
    @abstractmethod
    def create_conversation(self, username: str) -> Conversazioni:
        pass

    @abstractmethod
    def conversation_exist(self, conv_id: int) -> bool:
        pass
