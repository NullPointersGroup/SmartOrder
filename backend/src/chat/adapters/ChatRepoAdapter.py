from src.chat.ChatSchemas import Message
from src.db.models import Conversazioni
from src.enums import SenderEnum
from src.chat.adapters.ChatRepository import ChatRepository
from src.chat.ports.ChatRepoPort import ChatRepoPort


class ChatRepoAdapter(ChatRepoPort):
    def __init__(self, repo: ChatRepository) -> None:
        self.repo = repo

    def get_messages(self, conv_id: int) -> list[Message]:
        rows = self.repo.get_messages(conv_id)
        return [
            Message(id_message=r.id_messaggio, content=r.contenuto, sender=r.mittente)
            for r in rows
        ]

    def get_chat_history(self, conv_id: int, max_messages: int = 20) -> list[Message]:
        rows = self.repo.get_chat_history(conv_id, max_messages)
        return [
            Message(id_message=r.id_messaggio, content=r.contenuto, sender=r.mittente)
            for r in rows
        ]

    def add_message(self, conv_id: int, text: str, sender: SenderEnum) -> Message:
        row = self.repo.add_message(conv_id, text, sender)
        return Message(
            id_message=row.id_messaggio,
            content=row.contenuto,
            sender=row.mittente.value,
        )

    def conversation_exist(self, conv_id: int) -> bool:
        row = self.repo.get_conversation(conv_id)
        if row:
            return True
        else:
            return False

    def create_conversation(self, username: str) -> Conversazioni:
        return self.repo.create_conversation(username)
