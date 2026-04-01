from typing import List, Tuple
from sqlmodel import Session
from src.storico.ports.StoricoRepoPort import StoricoRepoPort
from src.storico.adapters.StoricoRepository import StoricoRepository
from src.storico.StoricoModels import Ordine, OrdineProdotto


class ConcreteGetOrdiniAdapter(StoricoRepoPort):

    def __init__(self, db: Session):
        self.repository = StoricoRepository(db)

    def get_ordini_by_username(
        self, username: str, pagina: int, per_pagina: int
    ) -> Tuple[List[Ordine], int]:
        return self.repository.get_ordini_by_username(username, pagina, per_pagina)

    def get_all_ordini(
        self, pagina: int, per_pagina: int
    ) -> Tuple[List[Ordine], int]:
        return self.repository.get_all_ordini(pagina, per_pagina)

    def get_prodotti_by_ordine_ids(self, ordine_ids: List[int]) -> List[OrdineProdotto]:
        return self.repository.get_prodotti_by_ordine_ids(ordine_ids)

    def duplica_ordine(self, codice_ordine: str, username: str) -> Ordine:
        return self.repository.duplica_ordine(codice_ordine, username)