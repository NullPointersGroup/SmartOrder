from abc import ABC, abstractmethod
from src.catalog.CatalogSchemas import CatalogProduct 

class CatalogRepoPort(ABC):
    @abstractmethod
    def get_product(self, prod_id: str) -> CatalogProduct | None:
        pass
    
    @abstractmethod
    # Siamo sicuri che una list sia abbastanza efficiente per quel mega-catalogo? Forse altre strutture dati sono da preferire
    def get_full_catalog(self) -> list[CatalogProduct]:
        pass


