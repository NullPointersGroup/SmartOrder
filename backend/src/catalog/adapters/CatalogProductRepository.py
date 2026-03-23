from typing import ClassVar
from sqlmodel import SQLModel, Field

from src.enums import MeasureUnitEnum


class CatalogProductRepository(SQLModel, table=True):
    __tablename__: ClassVar[str] = "anaart"
    prod_id: str = Field(default=None, primary_key=True)
    prod_des: str = Field(default="")
    measure_unit_description: str = Field(default="")
    measure_unit_type: MeasureUnitEnum = Field(default="")
    measure_unit_type_description: str = Field(default="")
    net_weight: float = Field(default=0.0)
    conf: float = Field(default=0.0)
    conf_pieces: float = Field(default=0.0)
    grammatura: float = Field(default=0.0)
    price: float = Field(default=0.0)
