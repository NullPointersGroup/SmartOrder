from unittest.mock import MagicMock

from src.vec.VecDbService import VecDbService
from tests.unit.vec.conftest import make_product, make_vector

#TU-B_326
def test_classify_query_returns_generic_for_short_query(service: VecDbService):
    assert service._classify_query("birra") == "generic"

#TU-B_327
def test_classify_query_returns_medium_for_two_word_query(service: VecDbService):
    assert service._classify_query("acqua uliveto") == "medium"

#TU-B_328
def test_classify_query_returns_specific_for_query_with_digits(service: VecDbService):
    assert service._classify_query("acqua uliveto pet 150") == "specific"

#TU-B_329
def test_load_catalog_calls_get_full_catalog(
    service: VecDbService, mock_catalog_repo: MagicMock
):
    mock_catalog_repo.get_full_catalog.return_value = []

    service.load_catalog()

    mock_catalog_repo.get_full_catalog.assert_called_once()

#TU-B_330
def test_load_catalog_embeds_only_product_name(
    service: VecDbService, mock_catalog_repo: MagicMock, mock_embedder: MagicMock
):
    mock_catalog_repo.get_full_catalog.return_value = [
        make_product("ABC1", "Pasta", 1.20),
    ]
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])

    service.load_catalog()

    mock_embedder.embed.assert_called_once_with("Pasta")

#TU-B_331
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

#TU-B_332
def test_load_cart_resets_cart_vect_before_reindex(
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

    mock_cart_vect.reset.assert_called_once()
    mock_cart_service.get_cart_products.assert_called_once_with("mario")
    mock_cart_vect.add.assert_called_once_with("ABC1", mock_embedder.embed.return_value)

#TU-B_333
def test_load_cart_embeds_only_product_name(
    service: VecDbService, mock_cart_service: MagicMock, mock_embedder: MagicMock
):
    mock_cart_service.get_cart_products.return_value = [
        make_product("ABC1", "Acqua", 0.50),
    ]
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])

    service.load_cart("mario")

    mock_embedder.embed.assert_called_once_with("Acqua")

#TU-B_334
def test_search_catalog_embeds_query_and_uses_given_threshold(
    service: VecDbService, mock_embedder: MagicMock, mock_catalog_vect: MagicMock
):
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_embedder.embed.return_value = vector
    mock_catalog_vect.search.return_value = []

    service.search_catalog("birra", 1.5)

    mock_embedder.embed.assert_called_once_with("birra")
    mock_catalog_vect.search.assert_called_once_with(
        vector, n=service.CATALOG_SEARCH_LIMIT, threshold=1.5
    )

#TU-B_335
def test_search_catalog_returns_results(
    service: VecDbService, mock_embedder: MagicMock, mock_catalog_vect: MagicMock
):
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_catalog_vect.search.return_value = ["ABC1", "ABC2"]

    result = service.search_catalog("pasta", 0.8)

    assert result == ["ABC1", "ABC2"]

#TU-B_336
def test_search_cart_reloads_cart_and_uses_given_threshold(
    service: VecDbService,
    mock_embedder: MagicMock,
    mock_cart_vect: MagicMock,
    mock_cart_service: MagicMock,
):
    mock_cart_service.get_cart_products.return_value = []
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_embedder.embed.return_value = vector
    mock_cart_vect.search.return_value = []

    service.search_cart("mario", "birre peroni", 0.9)

    mock_cart_vect.reset.assert_called_once()
    mock_cart_service.get_cart_products.assert_called_once_with("mario")
    mock_cart_vect.search.assert_called_once_with(
        vector, n=service.CART_SEARCH_LIMIT, threshold=0.9
    )

#TU-B_337
def test_search_cart_returns_results(
    service: VecDbService,
    mock_embedder: MagicMock,
    mock_cart_vect: MagicMock,
    mock_cart_service: MagicMock,
):
    mock_cart_service.get_cart_products.return_value = []
    mock_embedder.embed.return_value = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_cart_vect.search.return_value = ["ABC1"]

    result = service.search_cart("mario", "pasta", 0.8)

    assert result == ["ABC1"]
