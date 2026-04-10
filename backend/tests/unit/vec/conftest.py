from unittest.mock import MagicMock
import pytest
import numpy as np

from src.vec.EmbeddedCatalogService import EmbeddedCatalogService
from src.vec.EmbeddedCartService import EmbeddedCartService


DIMENSION = 4


def make_vector(values: list[float]) -> np.ndarray:
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
def mock_cart_repo() -> MagicMock:
    return MagicMock()


@pytest.fixture
def mock_catalog_repo() -> MagicMock:
    return MagicMock()


@pytest.fixture
def mock_embedder() -> MagicMock:
    return MagicMock()


@pytest.fixture
def catalog_service(
    mock_catalog_vect: MagicMock,
    mock_catalog_repo: MagicMock,
    mock_embedder: MagicMock,
) -> EmbeddedCatalogService:
    return EmbeddedCatalogService(
        catalog_vect=mock_catalog_vect,
        catalog_repo=mock_catalog_repo,
        embedder=mock_embedder,
    )


@pytest.fixture
def cart_service(
    mock_cart_vect: MagicMock,
    mock_cart_repo: MagicMock,
    mock_embedder: MagicMock,
) -> EmbeddedCartService:
    return EmbeddedCartService(
        cart_vect=mock_cart_vect,
        cart_repo=mock_cart_repo,
        embedder=mock_embedder,
    )


@pytest.fixture
def cart_service_embedded(cart_service: EmbeddedCartService) -> EmbeddedCartService:
    return cart_service
