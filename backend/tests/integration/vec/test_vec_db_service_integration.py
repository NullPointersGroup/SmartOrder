from unittest.mock import MagicMock

from src.vec.EmbeddedCatalogService import EmbeddedCatalogService
from src.vec.EmbeddedCartService import EmbeddedCartService
from src.vec.adapters.FaissCatalogDb import FaissCatalogDb
from src.vec.adapters.FaissCartDb import FaissCartDb
from tests.integration.vec.conftest import make_product


# TI_29
def test_load_and_search_catalog(
    catalog_service: EmbeddedCatalogService,
    mock_catalog_repo: MagicMock,
):
    mock_catalog_repo.get_full_catalog.return_value = [
        make_product("ABC1", "Pasta", 1.2),
        make_product("ABC2", "Acqua", 0.5),
    ]
    catalog_service.load_catalog()
    result = catalog_service.search_catalog("pasta", 1.0)
    assert "ABC1" in result


# TI_30
def test_load_catalog_indexes_all_products(
    catalog_service: EmbeddedCatalogService,
    mock_catalog_repo: MagicMock,
    catalog_faiss: FaissCatalogDb,
):
    mock_catalog_repo.get_full_catalog.return_value = [
        make_product("ABC1", "Pasta", 1.2),
        make_product("ABC2", "Acqua", 0.5),
        make_product("ABC3", "Vino", 3.0),
    ]
    catalog_service.load_catalog()
    assert len(catalog_faiss.prod_ids) == 3


# TI_31
def test_search_catalog_returns_empty_before_load(
    catalog_service: EmbeddedCatalogService,
):
    result = catalog_service.search_catalog("pasta", 1.0)
    assert result == []


# TI_32
def test_search_catalog_returns_closest(
    catalog_service: EmbeddedCatalogService,
    mock_catalog_repo: MagicMock,
):
    mock_catalog_repo.get_full_catalog.return_value = [
        make_product("ABC1", "Pasta", 1.2),
        make_product("ABC2", "Acqua", 0.5),
    ]
    catalog_service.load_catalog()

    result_pasta = catalog_service.search_catalog("Pasta 1.2", 1.0)
    result_acqua = catalog_service.search_catalog("Acqua 0.5", 1.0)

    assert result_pasta[0] == "ABC1"
    assert "ABC2" in result_acqua


# TI_33
def test_load_and_search_cart(
    cart_service: EmbeddedCartService,
    mock_cart_service: MagicMock,
):
    mock_cart_service.get_products.return_value = [
        make_product("ABC1", "Pasta", 1.2),
    ]
    cart_service.load_cart("mario")
    result = cart_service.search_cart("mario", "pasta", 1.0)
    assert "ABC1" in result


# TI_34
def test_load_cart_indexes_all_products(
    cart_service: EmbeddedCartService,
    mock_cart_service: MagicMock,
    cart_faiss: FaissCartDb,
):
    mock_cart_service.get_products.return_value = [
        make_product("ABC1", "Pasta", 1.2),
        make_product("ABC2", "Acqua", 0.5),
    ]
    cart_service.load_cart("mario")
    assert len(cart_faiss.prod_ids) == 2


# TI_35
def test_search_cart_returns_empty_before_load(
    cart_service: EmbeddedCartService,
):
    result = cart_service.search_cart("mario", "pasta", 1.0)
    assert result == []


# TI_36
def test_catalog_and_cart_indexes_are_independent(
    catalog_service: EmbeddedCatalogService,
    cart_service: EmbeddedCartService,
    mock_catalog_repo: MagicMock,
    mock_cart_service: MagicMock,
    catalog_faiss: FaissCatalogDb,
    cart_faiss: FaissCartDb,
):
    mock_catalog_repo.get_full_catalog.return_value = [
        make_product("ABC1", "Pasta", 1.2),
    ]
    mock_cart_service.get_products.return_value = [
        make_product("ABC2", "Acqua", 0.5),
    ]

    catalog_service.load_catalog()
    cart_service.load_cart("mario")

    assert catalog_faiss.prod_ids == ["ABC1"]
    assert cart_faiss.prod_ids == ["ABC2"]