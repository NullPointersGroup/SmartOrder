from backend.src.cart.CartSchemas import CartResponse, CartProductResponse
from backend.src.cart.ports.CartRepoPort import CartRepoPort
from backend.src.enums import CartUpdateOperation


class CartService:
    def __init__(self, repo: CartRepoPort) -> None:
        self.repo = repo

    # TODO service non dovrebbe conoscere CartResponse, sono del layer HTTP, bisogna cambiare CartResponse in CartProduct normale
    def get_cart_products(self, username: str) -> CartResponse:
        cart_products = self.repo.get_products(username)
        return CartResponse(products=cart_products, username=username)

    def add_product_to_cart(
        self, username: str, prod_id: str, qty: int
    ) -> CartProductResponse:
        product = self.repo.add_product(prod_id, username, qty)
        return CartProductResponse(product=product, username=username)

    def update_cart_quantity(
        self, username: str, prod_id: str, qty: int, operation: CartUpdateOperation
    ) -> CartProductResponse:
        product = self.repo.update_quantity(prod_id, username, qty, operation)
        return CartProductResponse(product=product, username=username)

    def remove_product_from_cart(
        self, username: str, prod_id: str
    ) -> CartProductResponse:
        product = self.repo.remove_product(prod_id, username)
        return CartProductResponse(product=product, username=username)
