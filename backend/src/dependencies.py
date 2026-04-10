from src.catalog.adapters.CatalogRepoAdapter import CatalogRepoAdapter
from src.vec.EmbeddedCatalogService import EmbeddedCatalogService

catalog_repo: CatalogRepoAdapter | None = None
embedded_catalog_service: EmbeddedCatalogService | None = None


# def get_catalog_repo() -> CatalogRepoAdapter:
#     if catalog_repo is None:
#         raise RuntimeError("catalog_repo non inizializzato")
#     return catalog_repo


# def get_embedded_catalog_service() -> EmbeddedCatalogService:
#     if embedded_catalog_service is None:
#         raise RuntimeError("embedded_catalog_service non inizializzato")
#     return embedded_catalog_service
