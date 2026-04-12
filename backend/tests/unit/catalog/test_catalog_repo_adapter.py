from unittest.mock import MagicMock
import pytest
from src.catalog.CatalogSchemas import CatalogProduct
from src.db.models import Anaart
from src.catalog.adapters.CatalogRepoAdapter import CatalogRepoAdapter
from src.enums import MeasureUnitEnum


def make_catalog_row(
    prod_id: str,
    prod_des: str,
    price: float,
    measure_unit_type: MeasureUnitEnum,
    measure_unit_type_description: str,
) -> Anaart:
    return Anaart(
        prod_id=prod_id,
        prod_des=prod_des,
        price=price,
        measure_unit_type=measure_unit_type,
        measure_unit_type_description=measure_unit_type_description,
    )


#TU-B_181
def test_get_product_returns_mapped_catalog_product():
    mock_repo = MagicMock()
    mock_repo.get_product.return_value = make_catalog_row(
        prod_id="AC002",
        prod_des="ACQUA FERRARELLE 100 VAR",
        price=0.42,
        measure_unit_type=MeasureUnitEnum.L,
        measure_unit_type_description="COLLI",
    )
    adapter = CatalogRepoAdapter(mock_repo)

    result = adapter.get_product("AC002")

    assert isinstance(result, CatalogProduct)
    assert result is not None
    assert result.prod_id == "AC002"
    assert result.name == "ACQUA FERRARELLE 100 VAR"
    assert result.price == pytest.approx(0.42)
    assert result.measure_unit == MeasureUnitEnum.L
    mock_repo.get_product.assert_called_once_with("AC002")


#TU-B_182
def test_get_product_returns_none_when_missing():
    mock_repo = MagicMock()
    mock_repo.get_product.return_value = None
    adapter = CatalogRepoAdapter(mock_repo)

    result = adapter.get_product("MISSING")

    assert result is None
    mock_repo.get_product.assert_called_once_with("MISSING")


#TU-B_183
def test_get_full_catalog_returns_mapped_products():
    mock_repo = MagicMock()
    mock_repo.get_full_catalog.return_value = [
        make_catalog_row("P001", "Prodotto 1", 1.5, MeasureUnitEnum.P, "PEZZI"),
        make_catalog_row("P002", "Prodotto 2", 2.5, MeasureUnitEnum.C, "CONFEZIONI"),
    ]
    adapter = CatalogRepoAdapter(mock_repo)

    result = adapter.get_full_catalog()

    assert len(result) == 2
    assert result[0].measure_unit == MeasureUnitEnum.P
    assert result[1].measure_unit == MeasureUnitEnum.C
    mock_repo.get_full_catalog.assert_called_once_with()
