from typing import List
from unittest.mock import Base
from pydantic import BaseModel

from src.enums import CartUpdateOperation, MeasureUnitEnum

class Product(BaseModel):
    prod_id: str
    name: str
    price: float
    measure_unit: MeasureUnitEnum


class CartProduct(Product):
    qty: int


class CartResponse(BaseModel):
    products: List[CartProduct]
    username: str


class CartProductResponse(BaseModel):
    product: CartProduct
    username: str


class AddProductRequest(BaseModel):
    prod_id: str
    qty: int


class RemoveProductRequest(BaseModel):
    prod_id: str


class UpdateProductRequest(BaseModel):
    prod_id: str
    qty: int
    operation: CartUpdateOperation
