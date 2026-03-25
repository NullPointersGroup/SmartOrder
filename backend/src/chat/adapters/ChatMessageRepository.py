from typing import ClassVar, Optional
from src.enums import SenderEnum

from sqlmodel import Field, SQLModel


class ChatMessageRepository(SQLModel, table=True):
    __tablename__: ClassVar[str] = "messaggi"
    id_conv: int = Field(foreign_key="conversazioni.id_conv", primary_key=True)
    id_messaggio: int = Field(default=None, primary_key=True, sa_column_kwargs={"autoincrement": True})
    mittente: SenderEnum = Field(default=None)
    contenuto: str = Field(default=None)
