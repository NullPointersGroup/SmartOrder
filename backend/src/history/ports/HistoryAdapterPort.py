from abc import ABC, abstractmethod
from typing import List, Tuple
from src.db.models import Order, OrdCliDet, Anaart
from datetime import date


class HistoryAdapterPort(ABC):

    @abstractmethod
    def get_orders_by_username(
        self, username: str, page: int, per_page: int, start_date: date | None = None, end_date: date | None = None
    ) -> Tuple[List[Order], int]:
        """Restituisce gli ordini di un utente (paginati) e il totale."""
        raise NotImplementedError

    @abstractmethod
    def get_all_orders(
        self, page: int, per_page: int, start_date: date | None = None, end_date: date | None = None
    ) -> Tuple[List[Order], int]:
        """Restituisce tutti gli ordini (admin, paginati) e il totale."""
        raise NotImplementedError

    @abstractmethod
    def get_products_by_order_ids(self, order_ids: List[int]) -> List[Tuple[OrdCliDet, Anaart]]:
        """Restituisce i prodotti per una lista di ordine_id."""
        raise NotImplementedError

    @abstractmethod
    def duplicate_order(self, code_order: str, username: str) -> Order:
        """Duplica un ordine esistente per username e restituisce il nuovo ordine."""
        raise NotImplementedError

    @abstractmethod
    def get_all_products_by_username(self, username: str) -> List[Tuple[str, str, int]]:
        """Restituisce prodotti aggregati per utente (codice, nome, frequenza)."""
        raise NotImplementedError
