from src.vec.adapters.FaissCartDb import FaissCartDb
from src.vec.adapters.FaissCatalogDb import FaissCatalogDb
from src.vec.ports.EmbedderPort import EmbedderPort
from src.cart.CartService import CartService
from src.catalog.ports.CatalogRepoPort import CatalogRepoPort


class VecDbService:
    def __init__(
        self,
        cart_service: CartService,
        catalog_repo: CatalogRepoPort,
        catalog_faiss: FaissCatalogDb,
        cart_faiss: FaissCartDb,
        embedder: EmbedderPort,
    ) -> None:
        self.cart_service = cart_service
        self.catalog_repo = catalog_repo
        self.catalog_faiss = catalog_faiss
        self.cart_faiss = cart_faiss
        self.embedder = embedder

    def load_catalog(self) -> None:
        products = self.catalog_repo.get_full_catalog()
        for p in products:
            vector = self.embedder.embed(f"{p.name} {p.price}")
            self.catalog_faiss.add(p.prod_id, vector)

    def load_cart(self, username: str) -> None:
        products = self.cart_service.get_cart_products(username)
        for p in products:
            vector = self.embedder.embed(f"{p.name} {p.price}")
            self.cart_faiss.add(p.prod_id, username, vector)
