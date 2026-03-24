from sqlmodel import Session, select

from src.chat.exceptions import ConversationNotFoundException
from src.db.models import Conversazione
from src.chat.adapters.ChatMessageRepository import ChatMessageRepository
from src.enums import SenderEnum


class ChatRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    ## TODO spostare Conversazione negli schemi della chat
    def get_conversation(self, conv_id: int) -> Conversazione | None:
        return self.db.get(Conversazione, conv_id)

    def create_conversation(self, username: str) -> Conversazione:
        conv = Conversazione(username=username)
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)
        return conv

    def get_messages(self, conv_id: int) -> list[ChatMessageRepository]:
        if not self.get_conversation(conv_id):
            raise ConversationNotFoundException(conv_id)
        stmt = select(ChatMessageRepository).where(
            ChatMessageRepository.id_conv == conv_id
        )
        return list(self.db.exec(stmt).all())

    def add_message(
        self, conv_id: int, text: str, sender: SenderEnum
    ) -> ChatMessageRepository:
        if not self.get_conversation(conv_id):
            raise ConversationNotFoundException(conv_id)
        msg = ChatMessageRepository(id_conv=conv_id, contenuto=text, mittente=sender)
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg
