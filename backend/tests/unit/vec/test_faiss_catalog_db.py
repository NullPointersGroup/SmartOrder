import pytest
import numpy as np
from tests.unit.vec.conftest import make_vector
from src.vec.adapters.FaissCatalogDb import FaissCatalogDb

DIMENSION = 4


@pytest.fixture
def faiss_db() -> FaissCatalogDb:
    return FaissCatalogDb(dimension=DIMENSION)


@pytest.fixture
def populated_db(faiss_db: FaissCatalogDb) -> FaissCatalogDb:
    faiss_db.add("ABC2", make_vector([1.0, 0.0, 0.0, 0.0]))
    faiss_db.add("BFG3", make_vector([0.0, 1.0, 0.0, 0.0]))
    faiss_db.add("CDE8", make_vector([0.0, 0.0, 1.0, 0.0]))
    return faiss_db


def test_add_single_product(faiss_db: FaissCatalogDb):
    faiss_db.add("BARRETTA CEREALI", make_vector([1.0, 0.0, 0.0, 0.0]))
    assert len(faiss_db.prod_ids) == 1
    assert faiss_db.prod_ids[0] == "BARRETTA CEREALI"


def test_add_multiple_product(faiss_db: FaissCatalogDb):
    prod_ids = ["ABC1", "GGE2", "HRE5"]
    faiss_db.add(prod_ids[0], make_vector([1.0, 0.0, 0.0, 0.0]))
    faiss_db.add(prod_ids[1], make_vector([0.0, 1.0, 0.0, 0.0]))
    faiss_db.add(prod_ids[2], make_vector([0.0, 0.0, 1.0, 0.0]))
    assert len(faiss_db.prod_ids) == 3
    assert faiss_db.prod_ids == [prod_ids[0], prod_ids[1], prod_ids[2]]


def test_convert_float32(faiss_db: FaissCatalogDb):
    vector_f64 = np.array([1.0, 0.0, 0.0, 0.0], dtype=np.float64)
    faiss_db.add("ACQUA MINERALE", vector_f64)
    assert len(faiss_db.prod_ids) == 1


def test_search_returns_exact_match(populated_db: FaissCatalogDb):
    query = make_vector([1.0, 0.0, 0.0, 0.0])
    result = populated_db.search(query, n=1, threshold=0.1)
    assert result == ["ABC2"]


def test_search_returns_empty_above_threshold(populated_db: FaissCatalogDb):
    query = make_vector([1.0, 0.0, 0.0, 0.0])
    # threshold bassissimo — nessun risultato tranne distanza 0
    result = populated_db.search(query, n=3, threshold=0.0)
    assert result == ["ABC2"]  # solo il vettore identico ha distanza 0


def test_search_returns_multiple_results(populated_db: FaissCatalogDb):
    query = make_vector([1.0, 0.0, 0.0, 0.0])
    result = populated_db.search(query, n=3, threshold=10.0)
    assert "ABC2" in result
    assert len(result) <= 3


def test_search_empty_db(faiss_db: FaissCatalogDb):
    query = make_vector([1.0, 0.0, 0.0, 0.0])
    result = faiss_db.search(query, n=3, threshold=1.0)
    assert result == []


def test_search_n_greater_than_indexed(faiss_db: FaissCatalogDb):
    # n > numero di prodotti indicizzati non deve dare errori
    faiss_db.add("ACQUA ULIVETO", make_vector([1.0, 0.0, 0.0, 0.0]))
    result = faiss_db.search(make_vector([1.0, 0.0, 0.0, 0.0]), n=10, threshold=1.0)
    assert "ACQUA ULIVETO" in result


def test_search_returns_closest_product(populated_db: FaissCatalogDb):
    # vettore più vicino a prod_id=2
    query = make_vector([0.1, 0.9, 0.0, 0.0])
    result = populated_db.search(query, n=1, threshold=10.0)
    assert result == ["BFG3"]
