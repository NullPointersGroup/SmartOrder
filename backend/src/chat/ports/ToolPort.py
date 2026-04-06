from abc import ABC, abstractmethod
from datetime import date

from src.cart.CartSchemas import CartProduct
from src.catalog.CatalogSchemas import CatalogProduct
from src.enums import CartUpdateOperation
from src.storico.StoricoSchemas import StoricoPageSchema


class ToolPortIn(ABC):
    @abstractmethod
    def get_cart_items(self) -> list[CartProduct]:
        pass

    @abstractmethod
    def search_catalog(self, query: str, threshold: float) -> list[CatalogProduct]:
        pass

    @abstractmethod
    def search_cart(self, query: str, threshold: float) -> list[CartProduct]:
        pass

    @abstractmethod
    def add_to_cart(self, prod_id: str, qty: int) -> CartProduct:
        pass

    @abstractmethod
    def remove_from_cart(self, prod_id: str) -> CartProduct:
        pass

    @abstractmethod
    def update_cart_item_qty(
        self, prod_id: str, qty: int, operation: CartUpdateOperation) -> CartProduct:
        pass

    @abstractmethod
    def get_ordini(
        self, pagina: int = 1, data_inizio: date | None = None, data_fine: date | None = None, ) -> StoricoPageSchema:
        pass