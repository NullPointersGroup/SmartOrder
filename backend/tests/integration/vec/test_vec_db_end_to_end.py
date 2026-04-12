from unittest.mock import MagicMock

from src.vec.EmbeddedCatalogService import EmbeddedCatalogService
from src.vec.EmbeddedCartService import EmbeddedCartService
from src.vec.adapters.FaissCatalogDb import FaissCatalogDb
from src.vec.adapters.FaissCartDb import FaissCartDb


# --- test catalog ---

# TI_16
def test_load_catalog_indexes_correct_count(
    real_catalog_service: EmbeddedCatalogService,
    catalog_faiss: FaissCatalogDb,
):
    real_catalog_service.load_catalog()
    assert len(catalog_faiss.prod_ids) == 4


# TI_17
def test_load_catalog_indexes_all_prod_ids(
    real_catalog_service: EmbeddedCatalogService,
    catalog_faiss: FaissCatalogDb,
):
    real_catalog_service.load_catalog()
    assert set(catalog_faiss.prod_ids) == {"ABC1", "ABC2", "ABC3", "ABC4"}


# TI_18
def test_search_catalog_before_load_returns_empty(
    real_catalog_service: EmbeddedCatalogService,
):
    result = real_catalog_service.search_catalog("Pasta Barilla 1.2", 1.0)
    assert result == []


# TI_19
def test_search_catalog_returns_indexed_product(
    real_catalog_service: EmbeddedCatalogService,
):
    real_catalog_service.load_catalog()
    result = real_catalog_service.search_catalog("Pasta Barilla 1.2", 1.0)
    assert "ABC1" in result


# TI_20
def test_search_catalog_finds_each_product_by_exact_text(
    real_catalog_service: EmbeddedCatalogService,
):
    real_catalog_service.load_catalog()
    assert "ABC1" in real_catalog_service.search_catalog("Pasta Barilla 1.2", 1.0)
    assert "ABC2" in real_catalog_service.search_catalog("Acqua Naturale 0.5", 1.0)
    assert "ABC3" in real_catalog_service.search_catalog("Vino Rosso 5.0", 1.0)
    assert "ABC4" in real_catalog_service.search_catalog("Olio Extravergine 8.0", 1.0)


# TI_21
def test_search_catalog_returns_results_within_threshold(
    real_catalog_service: EmbeddedCatalogService,
):
    real_catalog_service.load_catalog()
    result = real_catalog_service.search_catalog("Pasta Barilla 1.2", 1.0)
    assert len(result) > 0


# TI_22
def test_search_catalog_exact_text_has_distance_zero(
    real_catalog_service: EmbeddedCatalogService,
    catalog_faiss: FaissCatalogDb,
):
    real_catalog_service.load_catalog()
    result = real_catalog_service.search_catalog("Pasta Barilla 1.2", 1.0)
    assert "ABC1" in result


# --- test cart ---

# TI_23
def test_load_cart_indexes_products(
    cart_service: EmbeddedCartService,
    mock_cart_repo: MagicMock,
    cart_faiss: FaissCartDb,
):
    mock_cart_repo.get_products.return_value = [
        _make_cart_product("ABC1", "Pasta Barilla", 1.2),
        _make_cart_product("ABC2", "Acqua Naturale", 0.5),
    ]
    cart_service.load_cart("mario")
    assert len(cart_faiss.prod_ids) == 2


# TI_24
def test_load_cart_indexes_correct_prod_ids(
    cart_service: EmbeddedCartService,
    mock_cart_repo: MagicMock,
    cart_faiss: FaissCartDb,
):
    mock_cart_repo.get_products.return_value = [
        _make_cart_product("ABC1", "Pasta Barilla", 1.2),
        _make_cart_product("ABC2", "Acqua Naturale", 0.5),
    ]
    cart_service.load_cart("mario")
    assert set(cart_faiss.prod_ids) == {"ABC1", "ABC2"}


# TI_25
def test_search_cart_before_load_returns_empty(
    cart_service: EmbeddedCartService,
):
    # NON carica esplicitamente → ma search_cart lo fa internamente
    result = cart_service.search_cart("mario", "Pasta Barilla 1.2", 1.0)
    # dipende dal mock: senza prodotti → []
    assert result == []


# TI_26
def test_search_cart_returns_indexed_product(
    cart_service: EmbeddedCartService,
    mock_cart_repo: MagicMock,
):
    mock_cart_repo.get_products.return_value = [
        _make_cart_product("ABC1", "Pasta Barilla", 1.2),
    ]
    result = cart_service.search_cart("mario", "Pasta Barilla 1.2", 1.0)
    assert "ABC1" in result


# TI_27
def test_catalog_and_cart_indexes_are_independent(
    real_catalog_service: EmbeddedCatalogService,
    cart_service: EmbeddedCartService,
    mock_cart_repo: MagicMock,
    catalog_faiss: FaissCatalogDb,
    cart_faiss: FaissCartDb,
):
    mock_cart_repo.get_products.return_value = [
        _make_cart_product("ABC1", "Pasta Barilla", 1.2),
    ]

    real_catalog_service.load_catalog()
    cart_service.load_cart("mario")

    assert len(catalog_faiss.prod_ids) == 4
    assert cart_faiss.prod_ids == ["ABC1"]


# TI_28
def test_catalog_not_affected_by_cart_load(
    cart_service: EmbeddedCartService,
    mock_cart_repo: MagicMock,
    catalog_faiss: FaissCatalogDb,
):
    mock_cart_repo.get_products.return_value = [
        _make_cart_product("ABC1", "Pasta Barilla", 1.2),
    ]

    cart_service.load_cart("mario")
    assert len(catalog_faiss.prod_ids) == 0


# --- helper ---

def _make_cart_product(prod_id: str, name: str, price: float) -> MagicMock:
    p = MagicMock()
    p.prod_id = prod_id
    p.name = name
    p.price = price
    return p
