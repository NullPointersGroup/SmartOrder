from typing import ClassVar, Optional
from enum import Enum

from sqlmodel import Field, SQLModel


class MittenteEnum(str, Enum):
    utente = "Utente"
    chatbot = "Chatbot"


class Utente(SQLModel, table=True):
    __tablename__: ClassVar[str] = "utentiweb"

    # TODO nel database username ha lunghezza massima 24, è da cambiare qui?
    username: Optional[str] = Field(default=None, max_length=255, primary_key=True)
    descrizione: Optional[str] = Field(default=None, max_length=80)
    email: Optional[str] = Field(default=None, max_length=255)
    password: Optional[str] = Field(default=None, max_length=60)


class Conversazione(SQLModel, table=True):
    __tablename__: ClassVar[str] = "conversazioni"
    id_conv: int = Field(default=None, primary_key=True)
    username: Optional[str] = Field(default=None, max_length=24)


class Messaggio(SQLModel, table=True):
    __tablename__: ClassVar[str] = "messaggi"
    id_conv: int = Field(foreign_key="conversazioni.id_conv", primary_key=True)
    id_messaggio: Optional[int] = Field(default=None, primary_key=True)
    mittente: Optional[MittenteEnum] = Field(default=None)
    contenuto: Optional[str] = Field(default=None)
