from typing import ClassVar, Optional

from sqlmodel import Field, SQLModel


class Utente(SQLModel, table=True):
    __tablename__: ClassVar[str] = "utentiweb"
    username: Optional[str] = Field(default=None, max_length=255, primary_key=True)
    descrizione: Optional[str] = Field(default=None, max_length=80)
    email: Optional[str] = Field(default=None, max_length=255)
    password: Optional[str] = Field(default=None, max_length=60)
