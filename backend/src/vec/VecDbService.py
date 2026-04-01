from src.cart.CartService import CartService
from src.catalog.ports.CatalogRepoPort import CatalogRepoPort
from src.vec.ports.EmbedderPort import EmbedderPort
from src.vec.ports.VecDbPortOut import VecDbPortOut


class VecDbService:
    def __init__(
        self,
        catalog_vect: VecDbPortOut,
        cart_vect: VecDbPortOut,
        cart_service: CartService,
        catalog_repo: CatalogRepoPort,
        embedder: EmbedderPort,
    ) -> None:
        self.catalog_vect = catalog_vect
        self.cart_vect = cart_vect
        self.cart_service = cart_service
        self.catalog_repo = catalog_repo
        self.embedder = embedder

    def load_catalog(self) -> None:
        products = self.catalog_repo.get_full_catalog()
        for p in products:
            vector = self.embedder.embed(f"{p.name} {p.price}")
            self.catalog_vect.add(p.prod_id, vector)

    def load_cart(self, username: str) -> None:
        products = self.cart_service.get_cart_products(username)
        for p in products:
            vector = self.embedder.embed(f"{p.name} {p.price}")
            self.cart_vect.add(p.prod_id, vector)

    def search_catalog(self, query: str) -> list[str]:
        vector = self.embedder.embed(query)
        return self.catalog_vect.search(vector, n=5, threshold=1.5)

    def search_cart(self, username: str, query: str) -> list[str]:
        self.load_cart(username)
        vector = self.embedder.embed(query)
        return self.cart_vect.search(vector, n=5, threshold=100)
