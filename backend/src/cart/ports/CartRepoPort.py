from src.cart.CartSchemas import CartProduct
from src.enums import CartUpdateOperation
from abc import ABC, abstractmethod


class CartRepoPort(ABC):
    @abstractmethod
    def get_products(self, username: str) -> list[CartProduct]:
        pass

    @abstractmethod
    def add_product(self, prod_id: str, username: str, qty: int) -> CartProduct:
        pass

    @abstractmethod
    def remove_product(self, prod_id: str, username: str) -> CartProduct:
        pass

    @abstractmethod
    def update_quantity(
        self, prod_id: str, username: str, qty: int, operation: CartUpdateOperation
    ) -> CartProduct:
        pass
    
    @abstractmethod
    def send_order(
        self, username: str
    ) -> None:
        pass
