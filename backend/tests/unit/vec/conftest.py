from unittest.mock import MagicMock
import pytest
import numpy as np

from src.vec.adapters.VecDbAdapter import VecDbAdapter
from src.vec.VecDbService import VecDbService



DIMENSION = 4


def make_vector(values: list[float]) -> np.ndarray:
    """Helper per creare vettori di test."""
    return np.array(values, dtype=np.float32)


def make_product(prod_id: str, name: str, price: float) -> MagicMock:
    product = MagicMock()
    product.prod_id = prod_id
    product.name = name
    product.price = price
    return product


@pytest.fixture
def mock_faiss_db() -> MagicMock:
    return MagicMock()


@pytest.fixture
def mock_catalog_vect() -> MagicMock:
    return MagicMock()


@pytest.fixture
def mock_cart_vect() -> MagicMock:
    return MagicMock()


@pytest.fixture
def mock_cart_service() -> MagicMock:
    return MagicMock()


@pytest.fixture
def mock_catalog_repo() -> MagicMock:
    return MagicMock()


@pytest.fixture
def mock_embedder() -> MagicMock:
    return MagicMock()


@pytest.fixture
def adapter(mock_service: MagicMock) -> VecDbAdapter:
    return VecDbAdapter(vec_db_service=mock_service)


@pytest.fixture
def mock_service() -> MagicMock:
    return MagicMock()


@pytest.fixture
def service(
    mock_catalog_vect: MagicMock,
    mock_cart_vect: MagicMock,
    mock_cart_service: MagicMock,
    mock_catalog_repo: MagicMock,
    mock_embedder: MagicMock,
) -> VecDbService:
    return VecDbService(
        catalog_vect=mock_catalog_vect,
        cart_vect=mock_cart_vect,
        cart_service=mock_cart_service,
        catalog_repo=mock_catalog_repo,
        embedder=mock_embedder,
    )
