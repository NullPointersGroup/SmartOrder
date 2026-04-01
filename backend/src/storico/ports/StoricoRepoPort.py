from abc import ABC, abstractmethod
from typing import List, Tuple
from src.storico.StoricoModels import Ordine, OrdineProdotto


class StoricoRepoPort(ABC):

    @abstractmethod
    def get_ordini_by_username(
        self, username: str, pagina: int, per_pagina: int
    ) -> Tuple[List[Ordine], int]:
        """Restituisce gli ordini di un utente (paginati) e il totale."""
        raise NotImplementedError

    @abstractmethod
    def get_all_ordini(
        self, pagina: int, per_pagina: int
    ) -> Tuple[List[Ordine], int]:
        """Restituisce tutti gli ordini (admin, paginati) e il totale."""
        raise NotImplementedError

    @abstractmethod
    def get_prodotti_by_ordine_ids(self, ordine_ids: List[int]) -> List[OrdineProdotto]:
        """Restituisce i prodotti per una lista di ordine_id."""
        raise NotImplementedError

    @abstractmethod
    def duplica_ordine(self, codice_ordine: str, username: str) -> Ordine:
        """Duplica un ordine esistente per username e restituisce il nuovo ordine."""
        raise NotImplementedError