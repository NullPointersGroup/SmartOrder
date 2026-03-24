from src.cart.CartSchemas import CartProduct
from src.cart.ports.CartRepoPort import CartRepoPort
from src.enums import CartUpdateOperation


class CartService:
    def __init__(self, repo: CartRepoPort) -> None:
        self.repo = repo

    def get_cart_products(self, username: str) -> list[CartProduct]:
        cart_products = self.repo.get_products(username)
        return cart_products

    def add_product_to_cart(self, username: str, prod_id: str, qty: int) -> CartProduct:
        product = self.repo.add_product(prod_id, username, qty)
        return product

    def update_cart_quantity(
        self, username: str, prod_id: str, qty: int, operation: CartUpdateOperation
    ) -> CartProduct:
        product = self.repo.update_quantity(prod_id, username, qty, operation)
        return product

    def remove_product_from_cart(self, username: str, prod_id: str) -> CartProduct:
        product = self.repo.remove_product(prod_id, username)
        return product
