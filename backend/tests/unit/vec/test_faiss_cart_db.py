import numpy as np
import pytest

pytest.importorskip("faiss")

from src.vec.adapters.FaissCartDb import FaissCartDb
from tests.unit.vec.conftest import make_vector

DIMENSION = 4


@pytest.fixture
def faiss_db() -> FaissCartDb:
    return FaissCartDb(dimension=DIMENSION)


@pytest.fixture
def populated_db(faiss_db: FaissCartDb) -> FaissCartDb:
    faiss_db.add("ADE3", "mario", make_vector([1.0, 0.0, 0.0, 0.0]))
    faiss_db.add("GGR1", "mario", make_vector([0.0, 1.0, 0.0, 0.0]))
    faiss_db.add("IOP7", "luigi", make_vector([0.0, 0.0, 1.0, 0.0]))
    return faiss_db


def test_add_single_product(faiss_db: FaissCartDb):
    faiss_db.add("ADE3", "mario", make_vector([1.0, 0.0, 0.0, 0.0]))
    assert len(faiss_db.prod_ids) == 1
    assert faiss_db.prod_ids[0] == "ADE3"


def test_add_updates_user_map(faiss_db: FaissCartDb):
    faiss_db.add("ADE3", "mario", make_vector([1.0, 0.0, 0.0, 0.0]))
    faiss_db.add("IOP4", "mario", make_vector([0.0, 1.0, 0.0, 0.0]))
    assert "mario" in faiss_db.user_map
    assert len(faiss_db.user_map["mario"]) == 2


def test_add_multiple_users(faiss_db: FaissCartDb):
    faiss_db.add("POL8", "mario", make_vector([1.0, 0.0, 0.0, 0.0]))
    faiss_db.add("IOP4", "luigi", make_vector([0.0, 1.0, 0.0, 0.0]))
    assert "mario" in faiss_db.user_map
    assert "luigi" in faiss_db.user_map


def test_add_correct_positions_in_user_map(faiss_db: FaissCartDb):
    faiss_db.add("MAX3", "mario", make_vector([1.0, 0.0, 0.0, 0.0]))
    faiss_db.add("PIU7", "luigi", make_vector([0.0, 1.0, 0.0, 0.0]))
    faiss_db.add("IOP4", "mario", make_vector([0.0, 0.0, 1.0, 0.0]))
    assert faiss_db.user_map["mario"] == [0, 2]
    assert faiss_db.user_map["luigi"] == [1]


def test_add_converts_to_float32(faiss_db: FaissCartDb):
    vector_f64 = np.array([1.0, 0.0, 0.0, 0.0], dtype=np.float64)
    faiss_db.add("OOP3", "mario", vector_f64)
    assert len(faiss_db.prod_ids) == 1


def test_search_returns_exact_match(populated_db: FaissCartDb):
    query = make_vector([1.0, 0.0, 0.0, 0.0])
    result = populated_db.search(query, n=1, threshold=0.1, username="mario")
    assert result == ["ADE3"]


def test_search_filters_by_username(populated_db: FaissCartDb):
    query = make_vector([0.0, 0.0, 1.0, 0.0])
    result = populated_db.search(query, n=3, threshold=10.0, username="mario")
    assert "IOP7" not in result


def test_search_returns_only_user_products(populated_db: FaissCartDb):
    query = make_vector([1.0, 0.0, 0.0, 0.0])
    result = populated_db.search(query, n=3, threshold=10.0, username="luigi")
    assert all(prod_id == "IOP7" for prod_id in result)


def test_search_empty_db(faiss_db: FaissCartDb):
    query = make_vector([1.0, 0.0, 0.0, 0.0])
    result = faiss_db.search(query, n=3, threshold=1.0, username="mario")
    assert result == []


def test_search_unknown_username(populated_db: FaissCartDb):
    query = make_vector([1.0, 0.0, 0.0, 0.0])
    result = populated_db.search(query, n=3, threshold=10.0, username="unknown")
    assert result == []


def test_search_n_greater_than_indexed(faiss_db: FaissCartDb):
    faiss_db.add("POL8", "mario", make_vector([1.0, 0.0, 0.0, 0.0]))
    result = faiss_db.search(
        make_vector([1.0, 0.0, 0.0, 0.0]), n=10, threshold=1.0, username="mario"
    )
    assert "POL8" in result


def test_search_returns_closest_product(populated_db: FaissCartDb):
    query = make_vector([0.1, 0.9, 0.0, 0.0])
    result = populated_db.search(query, n=1, threshold=10.0, username="mario")
    assert result == ["GGR1"]


def test_reset_clears_index_prod_ids_and_user_map(populated_db: FaissCartDb):
    populated_db.reset()

    assert populated_db.prod_ids == []
    assert populated_db.user_map == {}
    result = populated_db.search(
        make_vector([1.0, 0.0, 0.0, 0.0]), n=3, threshold=1.0, username="mario"
    )
    assert result == []
