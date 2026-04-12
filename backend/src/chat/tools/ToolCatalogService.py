from src.catalog.CatalogSchemas import CatalogProduct
from src.catalog.ports.CatalogRepoPort import CatalogRepoPort
from src.vec.EmbeddedCatalogService import EmbeddedCatalogService


class ToolCatalogService:
    def __init__(
        self,
        embedded_catalog: EmbeddedCatalogService,
        catalog_repo: CatalogRepoPort,
        preferred_product_frequency: dict[str, int] | None = None,
    ) -> None:
        self.embedded_catalog = embedded_catalog
        self.catalog_repo = catalog_repo
        self.preferred_product_frequency = preferred_product_frequency or {}

    def search_catalog(self, query: str, threshold: float) -> list[CatalogProduct]:
        prod_ids = self.embedded_catalog.search_catalog(query, threshold)
        results = []
        for pid in prod_ids:
            product = self.catalog_repo.get_product(pid)
            if product:
                results.append(product)
        if not results or not self.preferred_product_frequency:
            return results

        original_rank = {p.prod_id: idx for idx, p in enumerate(results)}
        return sorted(
            results,
            key=lambda p: (
                -self.preferred_product_frequency.get(p.prod_id, 0),
                original_rank.get(p.prod_id, 10_000),
            ),
        )
