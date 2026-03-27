from typing import cast
from sqlmodel import Session
from unittest.mock import MagicMock
from src.vec.VecDbService import VecDbService
from src.vec.adapters.CatalogVecDbAdapter import CatalogVecDbAdapter
from src.vec.adapters.FaissCatalogDb import FaissCatalogDb
from src.vec.adapters.FaissCartDb import FaissCartDb


def test_load_catalog_indexes_correct_count(
    real_vec_service: VecDbService,
    catalog_faiss: FaissCatalogDb,
):
    real_vec_service.load_catalog()
    # seeded_catalog ha inserito 4 prodotti
    assert len(catalog_faiss.prod_ids) == 4


def test_load_catalog_indexes_all_prod_ids(
    real_vec_service: VecDbService,
    catalog_faiss: FaissCatalogDb,
):
    real_vec_service.load_catalog()
    assert set(catalog_faiss.prod_ids) == {"ABC1", "ABC2", "ABC3", "ABC4"}


def test_search_catalog_before_load_returns_empty(real_vec_service: VecDbService):
    result = real_vec_service.search_catalog("Pasta Barilla 1.2")
    assert result == []


def test_search_catalog_returns_indexed_product(real_vec_service: VecDbService):
    real_vec_service.load_catalog()
    # cerca con il testo esatto usato per indicizzare → distanza 0
    result = real_vec_service.search_catalog("Pasta Barilla 1.2")
    assert "ABC1" in result


def test_search_catalog_finds_each_product_by_exact_text(
    real_vec_service: VecDbService,
):
    real_vec_service.load_catalog()
    # ogni prodotto viene trovato cercando il suo testo esatto
    assert "ABC1" in real_vec_service.search_catalog("Pasta Barilla 1.2")
    assert "ABC2" in real_vec_service.search_catalog("Acqua Naturale 0.5")
    assert "ABC3" in real_vec_service.search_catalog("Vino Rosso 5.0")
    assert "ABC4" in real_vec_service.search_catalog("Olio Extravergine 8.0")


def test_search_catalog_returns_results_within_threshold(
    real_vec_service: VecDbService,
):
    real_vec_service.load_catalog()
    # con threshold altissimo trova almeno qualcosa
    result = real_vec_service.search_catalog("Pasta Barilla 1.2")
    assert len(result) > 0


def test_search_catalog_exact_text_has_distance_zero(
    real_vec_service: VecDbService,
    catalog_faiss: FaissCatalogDb,
):
    real_vec_service.load_catalog()
    # il testo esatto produce distanza 0 quindi passa qualsiasi threshold
    result = real_vec_service.search_catalog("Pasta Barilla 1.2")
    assert "ABC1" in result


# --- test load_cart + search_cart ---


def test_load_cart_indexes_products(
    real_vec_service: VecDbService,
    mock_cart_service: MagicMock,
    cart_faiss: FaissCartDb,
):
    mock_cart_service.get_cart_products.return_value = [
        _make_cart_product("ABC1", "Pasta Barilla", 1.2),
        _make_cart_product("ABC2", "Acqua Naturale", 0.5),
    ]
    real_vec_service.load_cart("mario")
    assert len(cart_faiss.prod_ids) == 2


def test_load_cart_indexes_correct_prod_ids(
    real_vec_service: VecDbService,
    mock_cart_service: MagicMock,
    cart_faiss: FaissCartDb,
):
    mock_cart_service.get_cart_products.return_value = [
        _make_cart_product("ABC1", "Pasta Barilla", 1.2),
        _make_cart_product("ABC2", "Acqua Naturale", 0.5),
    ]
    real_vec_service.load_cart("mario")
    assert set(cart_faiss.prod_ids) == {"ABC1", "ABC2"}


def test_search_cart_before_load_returns_empty(real_vec_service: VecDbService):
    result = real_vec_service.search_cart("mario", "Pasta Barilla 1.2")
    assert result == []


def test_search_cart_returns_indexed_product(
    real_vec_service: VecDbService,
    mock_cart_service: MagicMock,
):
    mock_cart_service.get_cart_products.return_value = [
        _make_cart_product("ABC1", "Pasta Barilla", 1.2),
    ]
    real_vec_service.load_cart("mario")
    result = real_vec_service.search_cart("mario", "Pasta Barilla 1.2")
    assert "ABC1" in result


def test_catalog_and_cart_indexes_are_independent(
    real_vec_service: VecDbService,
    mock_cart_service: MagicMock,
    catalog_faiss: FaissCatalogDb,
    cart_faiss: FaissCartDb,
):
    mock_cart_service.get_cart_products.return_value = [
        _make_cart_product("ABC1", "Pasta Barilla", 1.2),
    ]
    real_vec_service.load_catalog()
    real_vec_service.load_cart("mario")
    # catalogo ha tutti e 4 i prodotti, carrello solo ABC1
    assert len(catalog_faiss.prod_ids) == 4
    assert cart_faiss.prod_ids == ["ABC1"]


def test_catalog_not_affected_by_cart_load(
    real_vec_service: VecDbService,
    mock_cart_service: MagicMock,
    catalog_faiss: FaissCatalogDb,
):
    mock_cart_service.get_cart_products.return_value = [
        _make_cart_product("ABC1", "Pasta Barilla", 1.2),
    ]
    real_vec_service.load_cart("mario")
    # il catalogo non viene toccato dal load_cart
    assert len(catalog_faiss.prod_ids) == 0


# --- helper ---


def _make_cart_product(prod_id: str, name: str, price: float) -> MagicMock:
    p = MagicMock()
    p.prod_id = prod_id
    p.name = name
    p.price = price
    return p
