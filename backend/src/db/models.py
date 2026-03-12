from sqlmodel import SQLModel, Field
from enum import Enum
from datetime import date, datetime, timezone
from typing import ClassVar, Optional


class Utente(SQLModel, table=True):
    __tablename__: ClassVar[str] = "utentiweb"
    username: Optional[str] = Field(default=None, max_length=255, primary_key=True)
    descrizione: Optional[str] = Field(default=None, max_length=80)
    password: Optional[str] = Field(default=None, max_length=60)
