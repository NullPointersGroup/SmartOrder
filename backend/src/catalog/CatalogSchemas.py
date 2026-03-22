from src.enums import MeasureUnitEnum
from typing import List
from pydantic import BaseModel

class Product(BaseModel):
    prod_id: int
    qty: int
    name: str
    price: float
    measure_unit: MeasureUnitEnum

class CartRequest(BaseModel):
    username: str


class CartResponse(BaseModel):
    username: str
    products: List[Product]
