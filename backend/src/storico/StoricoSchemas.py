from datetime import datetime
from typing import List
from pydantic import BaseModel


class OrdineProdottoSchema(BaseModel):
    prodotto_id: int
    nome_prodotto: str
    quantita: int
    prezzo_unitario: float

    model_config = {"from_attributes": True}


class OrdineSchema(BaseModel):
    id: int
    username: str
    stato: str
    totale: float
    created_at: datetime
    prodotti: List[OrdineProdottoSchema] = []

    model_config = {"from_attributes": True}


class StoricoResponseSchema(BaseModel):
    ordini: List[OrdineSchema]
    totale_ordini: int