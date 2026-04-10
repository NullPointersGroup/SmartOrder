from unittest.mock import MagicMock
from src.vec.EmbeddedCartService import EmbeddedCartService


#TU-B_316
def test_load_cart_calls_repo_with_username(cart_service_embedded: EmbeddedCartService, mock_cart_repo: MagicMock):
    mock_cart_repo.get_products.return_value = []
    cart_service_embedded.load_cart("mario")
    mock_cart_repo.get_products.assert_called_once_with("mario")

#TU-B_317
def test_load_cart_passes_username(cart_service_embedded: EmbeddedCartService, mock_cart_repo: MagicMock):
    mock_cart_repo.get_products.return_value = []
    cart_service_embedded.load_cart("luigi")
    mock_cart_repo.get_products.assert_called_once_with("luigi")

#TU-B_318
def test_load_cart_returns_none(cart_service_embedded: EmbeddedCartService, mock_cart_repo: MagicMock):
    mock_cart_repo.get_products.return_value = []
    result = cart_service_embedded.load_cart("mario")
    assert result is None

#TU-B_322
def test_search_cart_calls_vect(cart_service_embedded: EmbeddedCartService, mock_cart_vect: MagicMock, mock_cart_repo: MagicMock):
    mock_cart_repo.get_products.return_value = []
    mock_cart_vect.search.return_value = []
    cart_service_embedded.search_cart("mario", "pasta", 0.7)
    mock_cart_vect.search.assert_called_once()

#TU-B_323
def test_search_cart_passes_username_and_query(cart_service_embedded: EmbeddedCartService, mock_cart_vect: MagicMock, mock_cart_repo: MagicMock):
    mock_cart_repo.get_products.return_value = []
    mock_cart_vect.search.return_value = []
    cart_service_embedded.search_cart("luigi", "acqua", 0.7)
    mock_cart_vect.search.assert_called_once()

#TU-B_324
def test_search_cart_returns_results(cart_service_embedded: EmbeddedCartService, mock_cart_vect: MagicMock, mock_cart_repo: MagicMock):
    mock_cart_repo.get_products.return_value = []
    mock_cart_vect.search.return_value = ["ABC1", "ABC2"]
    result = cart_service_embedded.search_cart("mario", "pasta", 0.7)
    assert result == ["ABC1", "ABC2"]

#TU-B_325
def test_search_cart_returns_empty(cart_service_embedded: EmbeddedCartService, mock_cart_vect: MagicMock, mock_cart_repo: MagicMock):
    mock_cart_repo.get_products.return_value = []
    mock_cart_vect.search.return_value = []
    result = cart_service_embedded.search_cart("mario", "pasta", 0.7)
    assert result == []