from sqlmodel import SQLModel

from backend.src.enums import MeasureUnitEnum


class CartProductRepository(SQLModel):
    id_prod: str
    qty: int
    prod_descr: str
    price: float
    measure_unit: MeasureUnitEnum
