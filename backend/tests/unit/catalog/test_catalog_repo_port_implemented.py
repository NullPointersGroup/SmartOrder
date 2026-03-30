from src.catalog.CatalogSchemas import CatalogProduct
from src.catalog.ports.CatalogRepoPort import CatalogRepoPort
from src.enums import MeasureUnitEnum


class ConcreteCatalogRepo(CatalogRepoPort):
    def get_product(self, prod_id: str) -> CatalogProduct | None:
        return CatalogProduct(
            prod_id="ABC1",
            name="Test Prodotto",
            price=2.0,
            measure_unit=MeasureUnitEnum.C,
        )

    def get_full_catalog(self) -> list[CatalogProduct]:
        return []


def test_get_product_can_be_implemented():
    catalog_repo = ConcreteCatalogRepo()
    result = catalog_repo.get_product("ABC1")
    assert isinstance(result, CatalogProduct)


def test_get_full_catalog_can_be_implemented():
    catalog_repo = ConcreteCatalogRepo()
    result = catalog_repo.get_full_catalog()
    assert isinstance(result, list)
