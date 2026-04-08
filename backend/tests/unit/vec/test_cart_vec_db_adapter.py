from unittest.mock import MagicMock
import pytest
import numpy as np
pytest.importorskip("faiss")

from src.vec.adapters.CartVecDbAdapter import CartVecDbAdapter
from tests.unit.vec.conftest import make_vector


@pytest.fixture
def adapter(mock_faiss_db: MagicMock) -> CartVecDbAdapter:
    return CartVecDbAdapter(faiss_db=mock_faiss_db, username="mario")

#TU-B_278
def test_add_calls_faiss_db(adapter: CartVecDbAdapter, mock_faiss_db: MagicMock):
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    adapter.add("ABC1", vector)
    mock_faiss_db.add.assert_called_once_with("ABC1", "mario", vector)

#TU-B_279
def test_add_passes_correct_prod_id(
    adapter: CartVecDbAdapter, mock_faiss_db: MagicMock
):
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    adapter.add("XYZ2", vector)
    args = mock_faiss_db.add.call_args[0]
    assert args[0] == "XYZ2"

#TU-B_280
def test_add_passes_username(adapter: CartVecDbAdapter, mock_faiss_db: MagicMock):
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    adapter.add("ABC1", vector)
    args = mock_faiss_db.add.call_args[0]
    assert args[1] == "mario"

#TU-B_281
def test_add_passes_correct_vector(adapter: CartVecDbAdapter, mock_faiss_db: MagicMock):
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    adapter.add("ABC1", vector)
    args = mock_faiss_db.add.call_args[0]
    np.testing.assert_array_equal(args[2], vector)

#TU-B_282
def test_search_calls_faiss_db(adapter: CartVecDbAdapter, mock_faiss_db: MagicMock):
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_faiss_db.search.return_value = []
    adapter.search(vector, n=3, threshold=0.8)
    mock_faiss_db.search.assert_called_once_with(vector, 3, 0.8, "mario")

#TU-B_283
def test_search_passes_username(adapter: CartVecDbAdapter, mock_faiss_db: MagicMock):
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_faiss_db.search.return_value = []
    adapter.search(vector, n=3, threshold=0.8)
    args = mock_faiss_db.search.call_args[0]
    assert args[3] == "mario"

#TU-B_284
def test_search_returns_faiss_results(
    adapter: CartVecDbAdapter, mock_faiss_db: MagicMock
):
    mock_faiss_db.search.return_value = ["ABC1", "XYZ2"]
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    result = adapter.search(vector, n=2, threshold=0.8)
    assert result == ["ABC1", "XYZ2"]

#TU-B_285
def test_search_returns_empty_list(adapter: CartVecDbAdapter, mock_faiss_db: MagicMock):
    mock_faiss_db.search.return_value = []
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    result = adapter.search(vector, n=3, threshold=0.8)
    assert result == []

#TU-B_286
def test_different_username(mock_faiss_db: MagicMock):
    # verifica che username diversi vengano passati correttamente
    adapter_luigi = CartVecDbAdapter(faiss_db=mock_faiss_db, username="luigi")
    vector = make_vector([1.0, 0.0, 0.0, 0.0])
    mock_faiss_db.search.return_value = []
    adapter_luigi.search(vector, n=3, threshold=0.8)
    args = mock_faiss_db.search.call_args[0]
    assert args[3] == "luigi"
