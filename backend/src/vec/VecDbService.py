from src.cart.CartService import CartService
from src.catalog.ports.CatalogRepoPort import CatalogRepoPort
from src.vec.ports.EmbedderPort import EmbedderPort
from src.vec.ports.VecDbPortOut import VecDbPortOut


class VecDbService:
    CATALOG_SEARCH_LIMIT = 30
    CART_SEARCH_LIMIT = 5
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

    @staticmethod
    def _classify_query(query: str) -> str:
        normalized = " ".join(query.lower().split())
        tokens = normalized.split()
        has_digits = any(ch.isdigit() for ch in normalized)

        if has_digits or len(tokens) >= 4 or len(normalized) >= 24:
            return "specific"
        if len(tokens) >= 2 or len(normalized) >= 10:
            return "medium"
        return "generic"
    
    def load_catalog(self) -> None:
        products = self.catalog_repo.get_full_catalog()
        for p in products:
            vector = self.embedder.embed(p.name)
            self.catalog_vect.add(p.prod_id, vector)

    def load_cart(self, username: str) -> None:
        self.cart_vect.reset()
        products = self.cart_service.get_cart_products(username)
        for p in products:
            vector = self.embedder.embed(p.name)
            self.cart_vect.add(p.prod_id, vector)
            
    def search_catalog(self, query: str, threshold: float) -> list[str]:
        vector = self.embedder.embed(query)
        return self.catalog_vect.search(
            vector, n=self.CATALOG_SEARCH_LIMIT, threshold=threshold
        )

    def search_cart(self, username: str, query: str, threshold: float) -> list[str]:
        self.load_cart(username)
        vector = self.embedder.embed(query)
        return self.cart_vect.search(
            vector, n=self.CART_SEARCH_LIMIT, threshold=threshold
        )
