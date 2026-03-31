from abc import ABC, abstractmethod
from src.cart.CartSchemas import CartProduct
from src.catalog.CatalogSchemas import CatalogProduct


class ToolPortIn(ABC):

    #@abstractmethod
    #def search_catalog(self, query: str) -> list[CatalogProduct]:
        #pass

    #@abstractmethod
    #def search_cart(self, query: str) -> list[CartProduct]:
        #pass

    @abstractmethod
    def add_to_cart(self, prod_id: str, qty: int) -> CartProduct:
        pass

    @abstractmethod
    def remove_from_cart(self, prod_id: str) -> CartProduct:
        pass