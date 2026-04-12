from unittest.mock import MagicMock
from src.vec.EmbeddedCatalogService import EmbeddedCatalogService


#TU-B_304
def test_load_catalog_calls_repo(catalog_service: EmbeddedCatalogService, mock_catalog_repo: MagicMock):
    mock_catalog_repo.get_full_catalog.return_value = []
    catalog_service.load_catalog()
    mock_catalog_repo.get_full_catalog.assert_called_once()

#TU-B_305
def test_load_catalog_returns_none(catalog_service: EmbeddedCatalogService, mock_catalog_repo: MagicMock):
    mock_catalog_repo.get_full_catalog.return_value = []
    result = catalog_service.load_catalog()
    assert result is None

#TU-B_306
def test_search_catalog_calls_vect(catalog_service: EmbeddedCatalogService, mock_catalog_vect: MagicMock, mock_embedder: MagicMock):
    mock_catalog_vect.search.return_value = []
    catalog_service.search_catalog("pasta", 0.7)
    mock_catalog_vect.search.assert_called_once()

#TU-B_307
def test_search_catalog_returns_results(catalog_service: EmbeddedCatalogService, mock_catalog_vect: MagicMock, mock_embedder: MagicMock):
    mock_catalog_vect.search.return_value = ["ABC1", "ABC2"]
    result = catalog_service.search_catalog("pasta", 0.7)
    assert result == ["ABC1", "ABC2"]

#TU-B_308
def test_search_catalog_returns_empty(catalog_service: EmbeddedCatalogService, mock_catalog_vect: MagicMock, mock_embedder: MagicMock):
    mock_catalog_vect.search.return_value = []
    result = catalog_service.search_catalog("pasta", 0.7)
    assert result == []