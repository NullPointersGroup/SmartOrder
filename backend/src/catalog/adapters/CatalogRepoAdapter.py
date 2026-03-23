from src.catalog.CatalogSchemas import CatalogProduct 
from src.catalog.ports.CatalogRepoPort import CatalogRepoPort
from src.enums import MeasureUnitEnum

from abc import abstractmethod #temporaneo

class CatalogRepoAdapter(CatalogRepoPort):
    def __init__(self, repo: CatalogRepoPort) -> None:
        super().__init__()
        self.repo = repo

    @abstractmethod
    def get_product(self, prod_id: str) -> CatalogProduct:
        """"""

