from sqlmodel import Session, select, col

from src.chat.exceptions import ConversationNotFoundException
from src.db.models import Conversations, Messages
from src.enums import SenderEnum


class ChatRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_conversation(self, conv_id: int) -> Conversations | None:
        return self.db.get(Conversations, conv_id)

    def create_conversation(self, username: str) -> Conversations:
        conv = Conversations(
            username=username,
            titolo="Nuova Conversazioni"
        )
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)
        return conv

    def get_messages(self, conv_id: int) -> list[Messages]:
        if not self.get_conversation(conv_id):
            raise ConversationNotFoundException(conv_id)
        stmt = select(Messages).where(
            Messages.id_conv == conv_id
        ).order_by(col(Messages.id_messaggio).asc())
        return list(self.db.exec(stmt).all())

    def get_chat_history(self, conv_id: int, max_messages: int = 20) -> list[Messages]:
        if not self.get_conversation(conv_id):
            raise ConversationNotFoundException(conv_id)
        stmt = (
            select(Messages)
            .where(Messages.id_conv == conv_id)
            .order_by(col(Messages.id_messaggio).desc())
            .limit(max_messages)
        )
        rows = list(self.db.exec(stmt).all())
        rows.reverse()
        return rows

    def add_message(self, conv_id: int, text: str, sender: SenderEnum) -> Messages:
        msg = Messages(
            id_conv=conv_id,
            contenuto=text,
            mittente=sender
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg
