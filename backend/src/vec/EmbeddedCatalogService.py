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
        print("\033[93mCaricando il Catalogo\033[0m")
        products = self.catalog_repo.get_full_catalog()
        for p in products:
            vector = self.embedder.embed(p.name)
            self.catalog_vect.add(p.prod_id, vector)

    def search_catalog(self, query: str, threshold: float) -> list[str]:
        vector = self.embedder.embed(query)
        return self.catalog_vect.search(
            vector, n=self.CATALOG_SEARCH_LIMIT, threshold=threshold
        )