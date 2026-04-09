from src.catalog.ports.CatalogRepoPort import CatalogRepoPort
from src.vec.ports.EmbedderPort import EmbedderPort
from src.vec.ports.VecDbPortOut import VecDbPortOut


class EmbeddedCatalogService:
    CATALOG_SEARCH_LIMIT = 30

    def __init__(
        self,
        catalog_vect: VecDbPortOut,
        catalog_repo: CatalogRepoPort,
        embedder: EmbedderPort,
    ) -> None:
        self.catalog_vect = catalog_vect
        self.catalog_repo = catalog_repo
        self.embedder = embedder

    def load_catalog(self) -> None:
        products = self.catalog_repo.get_full_catalog()
        for p in products:
            vector = self.embedder.embed(p.name)
            self.catalog_vect.add(p.prod_id, vector)

    def search_catalog(self, query: str, threshold: float) -> list[str]:
        vector = self.embedder.embed(query)
        return self.catalog_vect.search(
            vector, n=self.CATALOG_SEARCH_LIMIT, threshold=threshold
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
