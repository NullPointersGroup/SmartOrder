from typing import ClassVar, Optional
from datetime import datetime
from sqlmodel import Field, SQLModel


class Ordine(SQLModel, table=True):
    __tablename__: ClassVar[str] = "ordini"

    id: Optional[int] = Field(
        default=None, primary_key=True, sa_column_kwargs={"autoincrement": True}
    )
    username: str = Field(..., max_length=24, foreign_key="utentiweb.username")
    stato: str = Field(default="completato", max_length=32)
    totale: float = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class OrdineProdotto(SQLModel, table=True):
    __tablename__: ClassVar[str] = "ordini_prodotti"

    id: Optional[int] = Field(
        default=None, primary_key=True, sa_column_kwargs={"autoincrement": True}
    )
    ordine_id: int = Field(..., foreign_key="ordini.id")
    prodotto_id: int = Field(...)
    nome_prodotto: str = Field(..., max_length=128)
    quantita: int = Field(...)
    prezzo_unitario: float = Field(...)