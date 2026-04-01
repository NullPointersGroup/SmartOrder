from typing import Optional, ClassVar
from datetime import date
from sqlmodel import SQLModel, Field

class Ordine(SQLModel, table=True):
    __tablename__: ClassVar[str] = "ordine"
    id_ord:   int            = Field(primary_key=True)
    username: str            = Field(foreign_key="utentiweb.username")
    data:     Optional[date] = Field(default=None)

class OrdCliDet(SQLModel, table=True):
    __tablename__: ClassVar[str] = "ordclidet"
    id_ord:       int   = Field(foreign_key="ordine.id_ord", primary_key=True)
    cod_art:      str   = Field(foreign_key="anaart.cod_art", primary_key=True)
    qta_ordinata: float = Field(default=0)