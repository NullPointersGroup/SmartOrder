from typing import ClassVar
from sqlmodel import Field, SQLModel


class UserCartRepository(SQLModel, table=True):
    __tablename__: ClassVar[str] = "carrello"
    username: str = Field(
        max_length=24, foreign_key="utentiweb.username", primary_key=True
    )
    cod_art: str = Field(max_length=13, foreign_key="anaart.cod_art", primary_key=True)
    quantita: int = Field()
