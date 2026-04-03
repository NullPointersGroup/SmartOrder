import pytest
import numpy as np
from unittest.mock import MagicMock
from src.vec.adapters.CatalogVecDbAdapter import CatalogVecDbAdapter
from tests.unit.vec.conftest import make_vector


@pytest.fixture
def adapter(mock_faiss_db: MagicMock) -> CatalogVecDbAdapter:
    return CatalogVecDbAdapter(faiss_db=mock_faiss_db)


def test_add_calls_faiss_db(adapter: CatalogVecDbAdapter, mock_faiss_db: MagicMock):
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    adapter.add("ABC1", vector)
    mock_faiss_db.add.assert_called_once_with("ABC1", vector)


def test_add_passes_correct_prod_id(
    adapter: CatalogVecDbAdapter, mock_faiss_db: MagicMock
):
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    adapter.add("XYZ2", vector)
    args = mock_faiss_db.add.call_args[0]
    assert args[0] == "XYZ2"


def test_add_passes_correct_vector(
    adapter: CatalogVecDbAdapter, mock_faiss_db: MagicMock
):
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    adapter.add("ABC1", vector)
    args = mock_faiss_db.add.call_args[0]
    np.testing.assert_array_equal(args[1], vector)


def test_search_calls_faiss_db(adapter: CatalogVecDbAdapter, mock_faiss_db: MagicMock):
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_faiss_db.search.return_value = []
    adapter.search(vector, n=3, threshold=0.8)
    mock_faiss_db.search.assert_called_once_with(vector, 3, 0.8)


def test_search_returns_faiss_results(
    adapter: CatalogVecDbAdapter, mock_faiss_db: MagicMock
):
    mock_faiss_db.search.return_value = ["ABC1", "XYZ2"]
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    result = adapter.search(vector, n=2, threshold=0.8)
    assert result == ["ABC1", "XYZ2"]


def test_search_returns_empty_list(
    adapter: CatalogVecDbAdapter, mock_faiss_db: MagicMock
):
    mock_faiss_db.search.return_value = []
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    result = adapter.search(vector, n=3, threshold=0.8)
    assert result == []


def test_reset_calls_faiss_db_reset(
    adapter: CatalogVecDbAdapter, mock_faiss_db: MagicMock
):
    adapter.reset()

    mock_faiss_db.reset.assert_called_once_with()
