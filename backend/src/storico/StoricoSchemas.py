from typing import List, Optional
from pydantic import BaseModel


class ProdottoSchema(BaseModel):
    nome: str
    descrizione: str
    quantita: int

    model_config = {"from_attributes": True}


class OrdineSchema(BaseModel):
    codice_ordine: str
    numero_ordine: int
    data: str
    username: Optional[str] = None
    prodotti: List[ProdottoSchema] = []

    model_config = {"from_attributes": True}


class StoricoPageSchema(BaseModel):
    ordini: List[OrdineSchema]
    pagina_corrente: int
    totale_pagine: int