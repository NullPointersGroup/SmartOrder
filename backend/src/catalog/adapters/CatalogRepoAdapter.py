from src.catalog.CatalogSchemas import CatalogProduct 
from src.catalog.ports.CatalogRepoPort import CatalogRepoPort
from src.catalog.adapters.CatalogRepository import CatalogRepository


class CatalogRepoAdapter(CatalogRepoPort):
    def __init__(self, repo: CatalogRepository) -> None:
        super().__init__()
        self.repo = repo

    def get_product(self, prod_id: str) -> CatalogProduct | None:
        row = self.repo.get_product(prod_id)
        if row == None :
            return None
        return CatalogProduct(prod_id=row.prod_id, name=row.prod_des, price=row.price, measure_unit=row.measure_unit_type)
    
    def get_full_catalog(self) -> list[CatalogProduct]:
        rows = self.repo.get_full_catalog()
        return list(CatalogProduct(prod_id=r.prod_id, name=r.prod_des, price=r.price, measure_unit=r.measure_unit_type) 
                    for r in rows)



