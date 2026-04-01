from typing import List, Optional
from pydantic import BaseModel


class ProdottoSchema(BaseModel):
    nome: str
    quantita: float

class OrdineSchema(BaseModel):
    codice_ordine: str
    data: Optional[str] = None
    username: Optional[str] = None
    prodotti: List[ProdottoSchema] = []


class StoricoPageSchema(BaseModel):
    ordini: List[OrdineSchema]
    pagina_corrente: int
    totale_pagine: int