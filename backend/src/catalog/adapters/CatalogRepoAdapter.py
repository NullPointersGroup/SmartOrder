from src.catalog.ports.CatalogRepoPort import CatalogRepoPort


class CatalogRepoAdapter(CatalogRepoPort):
    def __init__(self, repo: CatalogRepository) -> None:
        super().__init__()
        self.repo = repo

    def get_product(self, prod_id: int) -> Product:

