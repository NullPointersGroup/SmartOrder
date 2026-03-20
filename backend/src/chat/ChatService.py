from typing import Annotated, List
from fastapi import Depends
from sqlmodel import Session

from src.chat.ChatSchemas import ChatResponse, MessageRequest, Message, Sender
from .FaissMock import FaissMock
from src.db.dbConnection import get_conn
from src.db.queryExecutor import QueryExecutor
from .GetAllMessagesCmd import GetAllMessagesCmd


class ChatService:
    def __init__(
        self,
        vec: Annotated[FaissMock, Depends(FaissMock)],
        db: Session = Depends(get_conn),
    ) -> None:
        self.userCartCache = vec
        self.queryExecutor = QueryExecutor(db)

    def get_all_messages(self, conv_id: int) -> list:
        res = self.queryExecutor.execute(GetAllMessagesCmd(conv_id))
        messages = [r.contenuto for r in res]
        return messages

    def send_message(self, conv_id: int, message: MessageRequest):
        pass
