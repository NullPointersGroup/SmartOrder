from tests.integration.vec.conftest import make_vector
from src.vec.adapters.CatalogVecDbAdapter import CatalogVecDbAdapter

#TI_07
def test_add_and_search_returns_correct_product(adapter: CatalogVecDbAdapter):
    adapter.add("ABC1", make_vector([1.0, 0.0, 0.0, 0.0]))
    adapter.add("ABC2", make_vector([0.0, 1.0, 0.0, 0.0]))

    result = adapter.search(make_vector([1.0, 0.0, 0.0, 0.0]), n=1, threshold=0.1)

    assert result == ["ABC1"]

#TI_08
def test_add_single_and_search(adapter: CatalogVecDbAdapter):
    adapter.add("ABC1", make_vector([1.0, 0.0, 0.0, 0.0]))
    result = adapter.search(make_vector([1.0, 0.0, 0.0, 0.0]), n=1, threshold=0.1)
    assert result == ["ABC1"]

#TI_09
def test_add_multiple_and_search_returns_closest(
    populated_adapter: CatalogVecDbAdapter,
):
    result = populated_adapter.search(
        make_vector([1.0, 0.0, 0.0, 0.0]), n=1, threshold=10.0
    )
    assert result == ["ABC1"]

#TI_10
def test_search_returns_multiple_results(populated_adapter: CatalogVecDbAdapter):
    result = populated_adapter.search(
        make_vector([1.0, 0.0, 0.0, 0.0]), n=3, threshold=10.0
    )
    assert len(result) == 3
    assert "ABC1" in result

#TI_11
def test_search_empty_db(adapter: CatalogVecDbAdapter):
    result = adapter.search(make_vector([1.0, 0.0, 0.0, 0.0]), n=3, threshold=1.0)
    assert result == []

#TI_12
def test_search_above_threshold_filters_results(populated_adapter: CatalogVecDbAdapter):
    # threshold molto basso — solo il vettore identico passa
    result = populated_adapter.search(
        make_vector([1.0, 0.0, 0.0, 0.0]), n=3, threshold=0.0
    )
    assert result == ["ABC1"]

#TI_13
def test_search_n_greater_than_indexed(adapter: CatalogVecDbAdapter):
    adapter.add("ABC1", make_vector([1.0, 0.0, 0.0, 0.0]))
    result = adapter.search(make_vector([1.0, 0.0, 0.0, 0.0]), n=10, threshold=1.0)
    assert "ABC1" in result

#TI_14
def test_search_returns_second_closest(populated_adapter: CatalogVecDbAdapter):
    # vettore più vicino ad ABC2
    result = populated_adapter.search(
        make_vector([0.1, 0.9, 0.0, 0.0]), n=1, threshold=10.0
    )
    assert result == ["ABC2"]

#TI_15
def test_add_preserves_order(adapter: CatalogVecDbAdapter):
    adapter.add("ABC1", make_vector([1.0, 0.0, 0.0, 0.0]))
    adapter.add("ABC2", make_vector([0.0, 1.0, 0.0, 0.0]))
    adapter.add("ABC3", make_vector([0.0, 0.0, 1.0, 0.0]))
    assert adapter.faiss_db.prod_ids == ["ABC1", "ABC2", "ABC3"]
