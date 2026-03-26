from typing import ClassVar, Optional
from enum import Enum

from sqlmodel import Field, SQLModel

class Utente(SQLModel, table=True):
    __tablename__: ClassVar[str] = "utentiweb"

    username: Optional[str] = Field(default=None, max_length=24, primary_key=True)
    email: Optional[str] = Field(default=None, max_length=255)
    password: Optional[str] = Field(default=None, max_length=60)
    admin: bool = Field(default=False)


class Conversazione(SQLModel, table=True):
    __tablename__: ClassVar[str] = "conversazioni"
    id_conv: int = Field(
        default=None, primary_key=True, sa_column_kwargs={"autoincrement": True}
    )
    username: str = Field(..., max_length=24)
    titolo: str = Field(..., max_length=24)
