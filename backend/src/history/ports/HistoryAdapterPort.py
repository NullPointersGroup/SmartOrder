from abc import ABC, abstractmethod
from typing import List, Tuple
from src.db.models import Order, OrdCliDet, Anaart
from datetime import date


class HistoryAdapterPort(ABC):

    @abstractmethod
    def get_ordini_by_username(
        self, username: str, pagina: int, per_pagina: int, data_inizio: date | None = None, data_fine: date | None = None
    ) -> Tuple[List[Order], int]:
        """Restituisce gli ordini di un utente (paginati) e il totale."""
        raise NotImplementedError

    @abstractmethod
    def get_all_ordini(
        self, pagina: int, per_pagina: int, data_inizio: date | None = None, data_fine: date | None = None
    ) -> Tuple[List[Order], int]:
        """Restituisce tutti gli ordini (admin, paginati) e il totale."""
        raise NotImplementedError

    @abstractmethod
    def get_prodotti_by_ordine_ids(self, ordine_ids: List[int]) -> List[Tuple[OrdCliDet, Anaart]]:
        """Restituisce i prodotti per una lista di ordine_id."""
        raise NotImplementedError

    @abstractmethod
    def duplica_ordine(self, codice_ordine: str, username: str) -> Order:
        """Duplica un ordine esistente per username e restituisce il nuovo ordine."""
        raise NotImplementedError

    @abstractmethod
    def get_all_products_by_username(self, username: str) -> List[Tuple[str, str, int]]:
        """Restituisce prodotti aggregati per utente (codice, nome, frequenza)."""
        raise NotImplementedError
