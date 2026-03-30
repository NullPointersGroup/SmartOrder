from unittest.mock import MagicMock
from src.vec.VecDbService import VecDbService
from tests.unit.vec.conftest import make_vector, make_product


def test_load_catalog_calls_get_full_catalog(
    service: VecDbService, mock_catalog_repo: MagicMock
):
    mock_catalog_repo.get_full_catalog.return_value = []
    service.load_catalog()
    mock_catalog_repo.get_full_catalog.assert_called_once()


def test_load_catalog_embeds_each_product(
    service: VecDbService, mock_catalog_repo: MagicMock, mock_embedder: MagicMock
):
    mock_catalog_repo.get_full_catalog.return_value = [
        make_product("ABC1", "Pasta", 1.20),
        make_product("ABC2", "Acqua", 0.50),
    ]
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    service.load_catalog()
    assert mock_embedder.embed.call_count == 2


def test_load_catalog_embeds_correct_text(
    service: VecDbService, mock_catalog_repo: MagicMock, mock_embedder: MagicMock
):
    mock_catalog_repo.get_full_catalog.return_value = [
        make_product("ABC1", "Pasta", 1.20),
    ]
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    service.load_catalog()
    mock_embedder.embed.assert_called_once_with("Pasta 1.2")


def test_load_catalog_adds_to_catalog_vect(
    service: VecDbService,
    mock_catalog_repo: MagicMock,
    mock_embedder: MagicMock,
    mock_catalog_vect: MagicMock,
):
    mock_catalog_repo.get_full_catalog.return_value = [
        make_product("ABC1", "Pasta", 1.20),
        make_product("ABC2", "Acqua", 0.50),
    ]
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    service.load_catalog()
    assert mock_catalog_vect.add.call_count == 2


def test_load_catalog_empty_catalog(
    service: VecDbService, mock_catalog_repo: MagicMock, mock_embedder: MagicMock
):
    mock_catalog_repo.get_full_catalog.return_value = []
    service.load_catalog()
    mock_embedder.embed.assert_not_called()


def test_load_cart_calls_get_cart_products(
    service: VecDbService, mock_cart_service: MagicMock
):
    mock_cart_service.get_cart_products.return_value = []
    service.load_cart("mario")
    mock_cart_service.get_cart_products.assert_called_once_with("mario")


def test_load_cart_embeds_each_product(
    service: VecDbService, mock_cart_service: MagicMock, mock_embedder: MagicMock
):
    mock_cart_service.get_cart_products.return_value = [
        make_product("ABC1", "Pasta", 1.20),
        make_product("ABC2", "Acqua", 0.50),
    ]
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    service.load_cart("mario")
    assert mock_embedder.embed.call_count == 2


def test_load_cart_adds_to_cart_vect(
    service: VecDbService,
    mock_cart_service: MagicMock,
    mock_embedder: MagicMock,
    mock_cart_vect: MagicMock,
):
    mock_cart_service.get_cart_products.return_value = [
        make_product("ABC1", "Pasta", 1.20),
    ]
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    service.load_cart("mario")
    mock_cart_vect.add.assert_called_once()


def test_load_cart_does_not_add_to_catalog_vect(
    service: VecDbService,
    mock_cart_service: MagicMock,
    mock_embedder: MagicMock,
    mock_catalog_vect: MagicMock,
):
    mock_cart_service.get_cart_products.return_value = [
        make_product("ABC1", "Pasta", 1.20),
    ]
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    service.load_cart("mario")
    mock_catalog_vect.add.assert_not_called()


def test_load_cart_empty_cart(
    service: VecDbService, mock_cart_service: MagicMock, mock_embedder: MagicMock
):
    mock_cart_service.get_cart_products.return_value = []
    service.load_cart("mario")
    mock_embedder.embed.assert_not_called()


def test_search_catalog_embeds_query(
    service: VecDbService, mock_embedder: MagicMock, mock_catalog_vect: MagicMock
):
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_catalog_vect.search.return_value = []
    service.search_catalog("pasta")
    mock_embedder.embed.assert_called_once_with("pasta")


def test_search_catalog_calls_catalog_vect(
    service: VecDbService, mock_embedder: MagicMock, mock_catalog_vect: MagicMock
):
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_embedder.embed.return_value = vector
    mock_catalog_vect.search.return_value = []
    service.search_catalog("pasta")
    mock_catalog_vect.search.assert_called_once_with(vector, n=5, threshold=0.8)


def test_search_catalog_returns_results(
    service: VecDbService, mock_embedder: MagicMock, mock_catalog_vect: MagicMock
):
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_catalog_vect.search.return_value = ["ABC1", "ABC2"]
    result = service.search_catalog("pasta")
    assert result == ["ABC1", "ABC2"]


def test_search_catalog_returns_empty(
    service: VecDbService, mock_embedder: MagicMock, mock_catalog_vect: MagicMock
):
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_catalog_vect.search.return_value = []
    result = service.search_catalog("pasta")
    assert result == []


def test_search_cart_embeds_query(
    service: VecDbService, mock_embedder: MagicMock, mock_cart_vect: MagicMock
):
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_cart_vect.search.return_value = []
    service.search_cart("mario", "pasta")
    mock_embedder.embed.assert_called_once_with("pasta")


def test_search_cart_calls_cart_vect(
    service: VecDbService, mock_embedder: MagicMock, mock_cart_vect: MagicMock
):
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_embedder.embed.return_value = vector
    mock_cart_vect.search.return_value = []
    service.search_cart("mario", "pasta")
    mock_cart_vect.search.assert_called_once_with(vector, n=5, threshold=0.8)


def test_search_cart_does_not_call_catalog_vect(
    service: VecDbService,
    mock_embedder: MagicMock,
    mock_cart_vect: MagicMock,
    mock_catalog_vect: MagicMock,
):
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_cart_vect.search.return_value = []
    service.search_cart("mario", "pasta")
    mock_catalog_vect.search.assert_not_called()


def test_search_cart_returns_results(
    service: VecDbService, mock_embedder: MagicMock, mock_cart_vect: MagicMock
):
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_cart_vect.search.return_value = ["ABC1", "ABC2"]
    result = service.search_cart("mario", "pasta")
    assert result == ["ABC1", "ABC2"]


def test_search_cart_returns_empty(
    service: VecDbService, mock_embedder: MagicMock, mock_cart_vect: MagicMock
):
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_cart_vect.search.return_value = []
    result = service.search_cart("mario", "pasta")
    assert result == []
