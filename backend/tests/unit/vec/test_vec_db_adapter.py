from unittest.mock import MagicMock
from src.vec.adapters.VecDbAdapter import VecDbAdapter

#TU-B_314
def test_get_catalog_calls_load_catalog(adapter: VecDbAdapter, mock_service: MagicMock):
    adapter.get_catalog()
    mock_service.load_catalog.assert_called_once()

#TU-B_315
def test_get_catalog_returns_none(adapter: VecDbAdapter, mock_service: MagicMock):
    result = adapter.get_catalog()
    assert result is None

#TU-B_316
def test_get_cart_calls_load_cart(adapter: VecDbAdapter, mock_service: MagicMock):
    adapter.get_cart("mario")
    mock_service.load_cart.assert_called_once_with("mario")

#TU-B_317
def test_get_cart_passes_username(adapter: VecDbAdapter, mock_service: MagicMock):
    adapter.get_cart("luigi")
    mock_service.load_cart.assert_called_once_with("luigi")

#TU-B_318
def test_get_cart_returns_none(adapter: VecDbAdapter, mock_service: MagicMock):
    result = adapter.get_cart("mario")
    assert result is None

#TU-B_319
def test_search_catalog_calls_service(adapter: VecDbAdapter, mock_service: MagicMock):
    mock_service.search_catalog.return_value = []
    adapter.search_catalog("pasta", 0.7)
    mock_service.search_catalog.assert_called_once_with("pasta", 0.7)

#TU-B_320
def test_search_catalog_returns_results(adapter: VecDbAdapter, mock_service: MagicMock):
    mock_service.search_catalog.return_value = ["ABC1", "ABC2"]
    result = adapter.search_catalog("pasta", 0.7)
    assert result == ["ABC1", "ABC2"]

#TU-B_321
def test_search_catalog_returns_empty(adapter: VecDbAdapter, mock_service: MagicMock):
    mock_service.search_catalog.return_value = []
    result = adapter.search_catalog("pasta", 0.7)
    assert result == []

#TU-B_322
def test_search_cart_calls_service(adapter: VecDbAdapter, mock_service: MagicMock):
    mock_service.search_cart.return_value = []
    adapter.search_cart("mario", "pasta", 0.7)
    mock_service.search_cart.assert_called_once_with("mario", "pasta", 0.7)

#TU-B_323
def test_search_cart_passes_username_and_query(
    adapter: VecDbAdapter, mock_service: MagicMock
):
    mock_service.search_cart.return_value = []
    adapter.search_cart("luigi", "acqua", 0.7)
    mock_service.search_cart.assert_called_once_with("luigi", "acqua", 0.7)

#TU-B_324
def test_search_cart_returns_results(adapter: VecDbAdapter, mock_service: MagicMock):
    mock_service.search_cart.return_value = ["ABC1", "ABC2"]
    result = adapter.search_cart("mario", "pasta", 0.7)
    assert result == ["ABC1", "ABC2"]

#TU-B_325
def test_search_cart_returns_empty(adapter: VecDbAdapter, mock_service: MagicMock):
    mock_service.search_cart.return_value = []
    result = adapter.search_cart("mario", "pasta", 0.7)
    assert result == []
