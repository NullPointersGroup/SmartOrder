from unittest.mock import MagicMock
from src.cart.adapters.CartRepoAdapter import CartRepoAdapter
from src.cart.adapters.CartRepository import CartRepository
from src.cart.CartService import CartService
import pytest


@pytest.fixture
def mock_repo():
    return MagicMock()


@pytest.fixture
def cart_service(mock_repo):
    return CartService(repo=mock_repo)


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def cart_repository(mock_db):
    return CartRepository(db=mock_db)


@pytest.fixture
def adapter(mock_repo):
    return CartRepoAdapter(repo=mock_repo)
