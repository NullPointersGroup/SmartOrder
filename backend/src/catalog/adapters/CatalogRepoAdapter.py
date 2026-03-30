from src.catalog.CatalogSchemas import CatalogProduct
from src.catalog.adapters.CatalogProductRepository import CatalogProductRepository
from src.catalog.adapters.CatalogRepository import CatalogRepository
from src.catalog.ports.CatalogRepoPort import CatalogRepoPort
from src.enums import MeasureUnitEnum

class CatalogRepoAdapter(CatalogRepoPort):
    def __init__(self, repo: CatalogRepository) -> None:
        self.repo = repo

    def _map_measure_unit(self, row: CatalogProductRepository) -> MeasureUnitEnum:
        unit_code = (row.measure_unit_type.name if row.measure_unit_type else "").upper()
        unit_description = (row.measure_unit_type_description or "").upper()

        if unit_code == "C" or unit_description == "CONFEZIONI":
            return MeasureUnitEnum.C
        if unit_code == "P" or unit_description == "PEZZI":
            return MeasureUnitEnum.P
        if unit_code == "L" or unit_description == "COLLI":
            return MeasureUnitEnum.L
        return MeasureUnitEnum.K

    def _map_product(self, row: CatalogProductRepository) -> CatalogProduct:
        return CatalogProduct(
            prod_id=row.prod_id,
            name=row.prod_des,
            price=row.price,
            measure_unit=self._map_measure_unit(row),
        )

    def get_product(self, prod_id: str) -> CatalogProduct | None:
        row = self.repo.get_product(prod_id)
        if row is None:
            return None
        return self._map_product(row)

    def get_full_catalog(self) -> list[CatalogProduct]:
        rows = self.repo.get_full_catalog()
        return [self._map_product(row) for row in rows]

