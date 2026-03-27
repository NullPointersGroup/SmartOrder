from unittest.mock import MagicMock
from src.vec.VecDbService import VecDbService
from src.vec.adapters.FaissCatalogDb import FaissCatalogDb
from src.vec.adapters.FaissCartDb import FaissCartDb
from tests.integration.vec.conftest import make_product


def test_load_and_search_catalog(service: VecDbService, mock_catalog_repo: MagicMock):
    mock_catalog_repo.get_full_catalog.return_value = [
        make_product("ABC1", "Pasta", 1.2),
        make_product("ABC2", "Acqua", 0.5),
    ]
    service.load_catalog()
    result = service.search_catalog("pasta")
    assert "ABC1" in result


def test_load_catalog_indexes_all_products(
    service: VecDbService, mock_catalog_repo: MagicMock, catalog_faiss: FaissCatalogDb
):
    mock_catalog_repo.get_full_catalog.return_value = [
        make_product("ABC1", "Pasta", 1.2),
        make_product("ABC2", "Acqua", 0.5),
        make_product("ABC3", "Vino", 3.0),
    ]
    service.load_catalog()
    assert len(catalog_faiss.prod_ids) == 3


def test_search_catalog_returns_empty_before_load(service: VecDbService):
    result = service.search_catalog("pasta")
    assert result == []


def test_search_catalog_returns_closest(
    service: VecDbService, mock_catalog_repo: MagicMock
):
    mock_catalog_repo.get_full_catalog.return_value = [
        make_product("ABC1", "Pasta", 1.2),
        make_product("ABC2", "Acqua", 0.5),
    ]
    service.load_catalog()
    result = service.search_catalog("acqua")
    assert result[0] == "ABC2"


def test_load_and_search_cart(service: VecDbService, mock_cart_service: MagicMock):
    mock_cart_service.get_cart_products.return_value = [
        make_product("ABC1", "Pasta", 1.2),
    ]
    service.load_cart("mario")
    result = service.search_cart("mario", "pasta")
    assert "ABC1" in result


def test_load_cart_indexes_all_products(
    service: VecDbService, mock_cart_service: MagicMock, cart_faiss: FaissCartDb
):
    mock_cart_service.get_cart_products.return_value = [
        make_product("ABC1", "Pasta", 1.2),
        make_product("ABC2", "Acqua", 0.5),
    ]
    service.load_cart("mario")
    assert len(cart_faiss.prod_ids) == 2


def test_search_cart_returns_empty_before_load(service: VecDbService):
    result = service.search_cart("mario", "pasta")
    assert result == []


def test_catalog_and_cart_indexes_are_independent(
    service: VecDbService,
    mock_catalog_repo: MagicMock,
    mock_cart_service: MagicMock,
    catalog_faiss: FaissCatalogDb,
    cart_faiss: FaissCartDb,
):
    mock_catalog_repo.get_full_catalog.return_value = [
        make_product("ABC1", "Pasta", 1.2),
    ]
    mock_cart_service.get_cart_products.return_value = [
        make_product("ABC2", "Acqua", 0.5),
    ]
    service.load_catalog()
    service.load_cart("mario")

    # i due indici sono separati
    assert catalog_faiss.prod_ids == ["ABC1"]
    assert cart_faiss.prod_ids == ["ABC2"]
