from src.chat.ChatSchemas import Message
from src.chat.enums import SenderEnum
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

    def add_message(self, conv_id: int, text: str) -> bool:
        return self.repo.add_message(conv_id, text, SenderEnum.User)
