from sqlmodel import Session, select

from src.chat.ChatSchemas import Sender
from src.chat.adapters import ChatMessageRepository
from src.chat.adapters.ChatMessageRepository import ChatMessageRepository, MittenteEnum


class ChatRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_messages(self, conv_id: int) -> list[ChatMessageRepository]:
        stmt = select(ChatMessageRepository).where(
            ChatMessageRepository.id_conv == conv_id
        )
        return list(self.db.exec(stmt).all())

    def add_message(self, conv_id: int, text: str, sender: MittenteEnum) -> bool:
        msg = ChatMessageRepository(id_conv=conv_id, contenuto=text, mittente=sender)
        self.db.add(msg)
        self.db.commit()
        ## TODO gestire errore nel commit
        return True
