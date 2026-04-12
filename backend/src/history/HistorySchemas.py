from typing import List, Optional
from pydantic import BaseModel


class ProductSchema(BaseModel):
    nome: str
    quantita: float

class OrderSchema(BaseModel):
    codice_ordine: str
    data: Optional[str] = None
    username: Optional[str] = None
    prodotti: List[ProductSchema] = []


class HistoryPageSchema(BaseModel):
    ordini: List[OrderSchema]
    pagina_corrente: int
    totale_pagine: int
