from abc import ABC, abstractmethod
from src.catalog.CatalogSchemas import CatalogProduct 

class CatalogRepoPort(ABC):
    @abstractmethod
    def get_product(self, prod_id: str) -> CatalogProduct | None:
        """
        @brief restituisce un prodotto singolo
        @return CatalogProduct, presente in src.catalog.CatalogSchemas
        """
        pass
    
    @abstractmethod
    def get_full_catalog(self) -> list[CatalogProduct]:
        """
        @brief restituisce la lista di prodotti singoli
        @return la lista di CatalogProduct, presente in src.catalog.CatalogSchemas
        """
        pass
