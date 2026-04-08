from tests.integration.vec.conftest import make_vector
from src.vec.adapters.CartVecDbAdapter import CartVecDbAdapter
from src.vec.adapters.FaissCartDb import FaissCartDb

#TI_01
def test_add_and_search_returns_correct_product(adapter_mario: CartVecDbAdapter):
    adapter_mario.add("ABC1", make_vector([1.0, 0.0, 0.0, 0.0]))
    result = adapter_mario.search(make_vector([1.0, 0.0, 0.0, 0.0]), n=1, threshold=0.1)
    assert result == ["ABC1"]

#TI_02
def test_search_filters_by_username(faiss_db: FaissCartDb):
    adapter_mario = CartVecDbAdapter(faiss_db=faiss_db, username="mario")
    adapter_luigi = CartVecDbAdapter(faiss_db=faiss_db, username="luigi")

    adapter_mario.add("ABC1", make_vector([1.0, 0.0, 0.0, 0.0]))
    adapter_luigi.add("ABC2", make_vector([1.0, 0.0, 0.0, 0.0]))

    result_mario = adapter_mario.search(
        make_vector([1.0, 0.0, 0.0, 0.0]), n=2, threshold=10.0
    )
    result_luigi = adapter_luigi.search(
        make_vector([1.0, 0.0, 0.0, 0.0]), n=2, threshold=10.0
    )

    assert "ABC1" in result_mario
    assert "ABC2" not in result_mario
    assert "ABC2" in result_luigi
    assert "ABC1" not in result_luigi

#TI_03
def test_search_empty_db(adapter_mario: CartVecDbAdapter):
    result = adapter_mario.search(make_vector([1.0, 0.0, 0.0, 0.0]), n=3, threshold=1.0)
    assert result == []

#TI_04
def test_search_unknown_user_returns_empty(faiss_db: FaissCartDb):
    adapter_mario = CartVecDbAdapter(faiss_db=faiss_db, username="mario")
    adapter_mario.add("ABC1", make_vector([1.0, 0.0, 0.0, 0.0]))

    adapter_unknown = CartVecDbAdapter(faiss_db=faiss_db, username="unknown")
    result = adapter_unknown.search(
        make_vector([1.0, 0.0, 0.0, 0.0]), n=3, threshold=10.0
    )
    assert result == []

#TI_05
def test_search_above_threshold_filters_results(adapter_mario: CartVecDbAdapter):
    adapter_mario.add("ABC1", make_vector([1.0, 0.0, 0.0, 0.0]))
    adapter_mario.add("ABC2", make_vector([0.0, 1.0, 0.0, 0.0]))
    result = adapter_mario.search(make_vector([1.0, 0.0, 0.0, 0.0]), n=2, threshold=0.0)
    assert result == ["ABC1"]

#TI_06
def test_search_returns_closest_product(faiss_db: FaissCartDb):
    adapter = CartVecDbAdapter(faiss_db=faiss_db, username="mario")
    adapter.add("ABC1", make_vector([1.0, 0.0, 0.0, 0.0]))
    adapter.add("ABC2", make_vector([0.0, 1.0, 0.0, 0.0]))
    result = adapter.search(make_vector([0.1, 0.9, 0.0, 0.0]), n=1, threshold=10.0)
    assert result == ["ABC2"]
