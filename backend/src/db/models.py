from typing import ClassVar, Optional
from datetime import date
from typing import ClassVar
from sqlalchemy import Column, Float, String, Enum
from sqlmodel import SQLModel, Field
from src.enums import MeasureUnitEnum, SenderEnum

"""
@brief Questo file definisce tutte le tabelle presenti nel DB
"""

class Utentiweb(SQLModel, table=True):
    __tablename__: ClassVar[str] = "utentiweb"

    username: Optional[str] = Field(default=None, max_length=24, primary_key=True)
    email: Optional[str] = Field(default=None, max_length=255)
    password: Optional[str] = Field(default=None, max_length=60)
    admin: bool = Field(default=False)


class Conversazioni(SQLModel, table=True):
    __tablename__: ClassVar[str] = "conversazioni"
    id_conv: int = Field(
        default=None, primary_key=True, sa_column_kwargs={"autoincrement": True}
    )
    username: str = Field(..., max_length=24)
    titolo: str = Field(..., max_length=24)

class Carrello(SQLModel, table=True):
    __tablename__: ClassVar[str] = "carrello"
    username: str = Field(
        max_length=24, foreign_key="utentiweb.username", primary_key=True
    )
    cod_art: str = Field(max_length=13, foreign_key="anaart.cod_art", primary_key=True)
    quantita: int = Field()
    
class Anaart(SQLModel, table=True):
    __tablename__: ClassVar[str] = "anaart"
    prod_id: str = Field(
        default=None,
        sa_column=Column("cod_art", String(13), primary_key=True),
    )
    prod_des: str = Field(
        default="",
        sa_column=Column("des_art", String(255)),
    )
    measure_unit_description: str = Field(
        default="",
        sa_column=Column("des_um", String(40)),
    )
    measure_unit_type: MeasureUnitEnum = Field(
        sa_column=Column("tipo_um", Enum(MeasureUnitEnum)),
    )
    measure_unit_type_description: str = Field(
        default="",
        sa_column=Column("des_tipo_um", String(20)),
    )
    net_weight: float = Field(
        default=0.0,
        sa_column=Column("peso_netto_conf", Float),
    )
    conf: float = Field(
        default=0.0,
        sa_column=Column("conf_collo", Float),
    )
    conf_pieces: float = Field(
        default=0.0,
        sa_column=Column("pezzi_conf", Float),
    )
    grammatura: float = Field(
        default=0.0,
        sa_column=Column("grammatura", Float),
    )
    price: float = Field(
        default=0.0,
        sa_column=Column("prezzo", Float),
    )
    
class Messaggi(SQLModel, table=True):
    __tablename__: ClassVar[str] = "messaggi"

    id_conv: int = Field(foreign_key="conversazioni.id_conv", primary_key=True)

    id_messaggio: int | None = Field(
        default=None,
        primary_key=True,
        sa_column_kwargs={"autoincrement": True}
    )

    mittente: SenderEnum
    contenuto: str
    
class Ordine(SQLModel, table=True):
    __tablename__: ClassVar[str] = "ordine"
    id_ord:   Optional[int]  = Field(default=None, primary_key=True)
    username: Optional[str]  = Field(default=None, foreign_key="utentiweb.username")
    data:     Optional[date] = Field(default=None)

class OrdCliDet(SQLModel, table=True):
    __tablename__: ClassVar[str] = "ordclidet"
    id_ord:       Optional[int]   = Field(default=None, foreign_key="ordine.id_ord", primary_key=True)
    cod_art:      Optional[str]   = Field(default=None, foreign_key="anaart.cod_art", primary_key=True)
    qta_ordinata: float           = Field(default=0)