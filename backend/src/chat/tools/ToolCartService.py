from src.cart.CartSchemas import CartProduct
from src.cart.ports.CartRepoPort import CartRepoPort
from src.enums import CartUpdateOperation
from src.vec.EmbeddedCartService import EmbeddedCartService


class ToolCartService:
    def __init__(
        self,
        username: str,
        cart_repo: CartRepoPort,
        embedded_cart: EmbeddedCartService,
    ) -> None:
        self.username = username
        self.cart_repo = cart_repo
        self.embedded_cart = embedded_cart

    def get_cart_items(self) -> list[CartProduct]:
        return self.cart_repo.get_products(self.username)

    def search_cart(self, query: str, threshold: float) -> list[CartProduct]:
        prod_ids = self.embedded_cart.search_cart(self.username, query, threshold)
        cart = self.cart_repo.get_products(self.username)
        cart_map = {p.prod_id: p for p in cart}
        return [cart_map[pid] for pid in prod_ids if pid in cart_map]

    def add_to_cart(self, prod_id: str, qty: int) -> CartProduct:
        return self.cart_repo.add_product(prod_id, self.username, qty)

    def remove_from_cart(self, prod_id: str) -> CartProduct:
        return self.cart_repo.remove_product(prod_id, self.username)

    def update_cart_item_qty(
        self, prod_id: str, qty: int, operation: CartUpdateOperation
    ) -> CartProduct:
        return self.cart_repo.update_quantity(prod_id, self.username, qty, operation)
