from src.cart.ports.CartRepoPort import CartRepoPort
from src.vec.ports.EmbedderPort import EmbedderPort
from src.vec.ports.VecDbPortOut import VecDbPortOut


class EmbeddedCartService:
    CART_SEARCH_LIMIT = 5

    def __init__(
        self,
        cart_vect: VecDbPortOut,
        cart_repo: CartRepoPort,
        embedder: EmbedderPort,
    ) -> None:
        self.cart_vect = cart_vect
        self.embedder = embedder
        self.cart_repo = cart_repo

    def load_cart(self, username: str) -> None:
        print("\033[93mCaricando il carrello\033[0m")
        self.cart_vect.reset()
        products = self.cart_repo.get_products(username)
        for p in products:
            vector = self.embedder.embed(p.name)
            self.cart_vect.add(p.prod_id, vector)

    def search_cart(self, username: str, query: str, threshold: float) -> list[str]:
        self.load_cart(username)
        vector = self.embedder.embed(query)
        return self.cart_vect.search(
            vector, n=self.CART_SEARCH_LIMIT, threshold=threshold
        )

    # @staticmethod
    # def _classify_query(query: str) -> str:
    #     normalized = " ".join(query.lower().split())
    #     tokens = normalized.split()
    #     has_digits = any(ch.isdigit() for ch in normalized)
    #
    #     if has_digits or len(tokens) >= 4 or len(normalized) >= 24:
    #         return "specific"
    #     if len(tokens) >= 2 or len(normalized) >= 10:
    #         return "medium"
    #     return "generic"
