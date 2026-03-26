from typing import ClassVar
from sqlalchemy import Column, Float, String, Enum
from sqlmodel import SQLModel, Field
from src.enums import MeasureUnitEnum

class CatalogProductRepository(SQLModel, table=True):
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
