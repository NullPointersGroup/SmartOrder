from src.cart.CartSchemas import CartProduct
from src.cart.CartService import CartService
from src.catalog.CatalogSchemas import CatalogProduct
from src.catalog.ports.CatalogRepoPort import CatalogRepoPort
from src.chat.ports.ToolPort import ToolPortIn
from src.enums import CartUpdateOperation
from src.vec.ports.VecDbPortIn import VecDbPortIn


class ToolService:
    def __init__(
        self,
        username: str,
        cart_service: CartService,
        catalog_repo: CatalogRepoPort,
        vec_db: VecDbPortIn,
    ) -> None:
        self.username = username
        self.cart_service = cart_service
        self.catalog_repo = catalog_repo
        self.vec_db = vec_db

    def search_catalog(self, query: str, threshold: float) -> list[CatalogProduct]:
        prod_ids = self.vec_db.search_catalog(query, threshold)
        results = []
        for pid in prod_ids:
            product = self.catalog_repo.get_product(pid)
            if product:
                results.append(product)
        return results

    def search_cart(self, query: str, threshold: float) -> list[CartProduct]:
        prod_ids = self.vec_db.search_cart(self.username, query, threshold)
        cart = self.cart_service.get_cart_products(self.username)
        cart_map = {p.prod_id: p for p in cart}
        return [cart_map[pid] for pid in prod_ids if pid in cart_map]

    def add_to_cart(self, prod_id: str, qty: int) -> CartProduct:
        return self.cart_service.add_product_to_cart(self.username, prod_id, qty)

    def remove_from_cart(self, prod_id: str) -> CartProduct:
        return self.cart_service.remove_product_from_cart(self.username, prod_id)

    def update_cart_item_qty(
        self, prod_id: str, qty: int, operation: CartUpdateOperation
    ) -> CartProduct:
        return self.cart_service.update_cart_quantity(
            self.username, prod_id, qty, operation
        )
