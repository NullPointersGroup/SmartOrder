from typing import ClassVar
from pydantic import Field
from sqlmodel import SQLModel, Field

from src.enums import MeasureUnitEnum


class CatalogProductRepository(SQLModel, table=True):
    __tablename__: ClassVar[str] = "anaart"
    prod_id: str = Field(default=None, primary_key=True)
    prod_des: str = Field(default=None)
    measure_unit_description: str = Field(default=None)
    measure_unit_type: MeasureUnitEnum = Field(default=None)
    measure_unit_type_description: str = Field(default=None)
    net_weight: float = Field(default=None)
    conf: float = Field(default=None)
    conf_pieces: float = Field(default=None)
    grammatura: float = Field(default=None)
    price: float = Field(default=None)
