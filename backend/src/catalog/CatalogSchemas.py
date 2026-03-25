from src.enums import MeasureUnitEnum
from typing import List
from pydantic import BaseModel

class CatalogProduct(BaseModel):
    prod_id: str 
    name: str
    price: float
    measure_unit: MeasureUnitEnum
