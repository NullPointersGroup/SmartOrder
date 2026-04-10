from abc import ABC, abstractmethod

from src.catalog.CatalogSchemas import CatalogProduct


class ToolCatalogPortIn(ABC):

    @abstractmethod
    def search_catalog(self, query: str, threshold: float) -> list[CatalogProduct]:
        pass
