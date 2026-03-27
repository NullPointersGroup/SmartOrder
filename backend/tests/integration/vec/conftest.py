import pytest
import numpy as np
from unittest.mock import MagicMock

from src.vec.adapters.FaissCatalogDb import FaissCatalogDb
from src.vec.adapters.FaissCartDb import FaissCartDb
from src.vec.adapters.CatalogVecDbAdapter import CatalogVecDbAdapter
from src.vec.adapters.CartVecDbAdapter import CartVecDbAdapter
from src.vec.VecDbService import VecDbService

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
def adapter() -> CatalogVecDbAdapter:
    faiss_db = FaissCatalogDb(dimension=DIMENSION)
    return CatalogVecDbAdapter(faiss_db=faiss_db)


@pytest.fixture
def populated_adapter(adapter: CatalogVecDbAdapter) -> CatalogVecDbAdapter:
    adapter.add("ABC1", make_vector([1.0, 0.0, 0.0, 0.0]))
    adapter.add("ABC2", make_vector([0.0, 1.0, 0.0, 0.0]))
    adapter.add("ABC3", make_vector([0.0, 0.0, 1.0, 0.0]))
    return adapter


@pytest.fixture
def adapter_mario(faiss_db: FaissCartDb) -> CartVecDbAdapter:
    return CartVecDbAdapter(faiss_db=faiss_db, username="mario")


@pytest.fixture
def adapter_luigi(faiss_db: FaissCartDb) -> CartVecDbAdapter:
    return CartVecDbAdapter(faiss_db=faiss_db, username="luigi")


@pytest.fixture
def populated_db(faiss_db: FaissCartDb) -> FaissCartDb:
    adapter_mario = CartVecDbAdapter(faiss_db=faiss_db, username="mario")
    adapter_luigi = CartVecDbAdapter(faiss_db=faiss_db, username="luigi")
    adapter_mario.add("ABC1", make_vector([1.0, 0.0, 0.0, 0.0]))
    adapter_mario.add("ABC2", make_vector([0.0, 1.0, 0.0, 0.0]))
    adapter_luigi.add("ABC3", make_vector([0.0, 0.0, 1.0, 0.0]))
    return faiss_db


@pytest.fixture
def faiss_db() -> FaissCartDb:
    return FaissCartDb(dimension=DIMENSION)


@pytest.fixture
def catalog_faiss() -> FaissCatalogDb:
    return FaissCatalogDb(dimension=DIMENSION)


@pytest.fixture
def cart_faiss() -> FaissCartDb:
    return FaissCartDb(dimension=DIMENSION)


@pytest.fixture
def mock_embedder() -> MagicMock:
    embedder = MagicMock()
    # ogni testo diverso produce un vettore diverso
    embedder.embed.side_effect = lambda text: {
        "Pasta 1.2": make_vector([1.0, 0.0, 0.0, 0.0]),
        "Acqua 0.5": make_vector([0.0, 1.0, 0.0, 0.0]),
        "Vino 3.0": make_vector([0.0, 0.0, 1.0, 0.0]),
        "pasta": make_vector([1.0, 0.0, 0.0, 0.0]),
        "acqua": make_vector([0.0, 1.0, 0.0, 0.0]),
    }.get(text, make_vector([0.5, 0.5, 0.0, 0.0]))
    return embedder


@pytest.fixture
def mock_catalog_repo() -> MagicMock:
    return MagicMock()


@pytest.fixture
def mock_cart_service() -> MagicMock:
    return MagicMock()


@pytest.fixture
def service(
    catalog_faiss: FaissCatalogDb,
    cart_faiss: FaissCartDb,
    mock_embedder: MagicMock,
    mock_catalog_repo: MagicMock,
    mock_cart_service: MagicMock,
) -> VecDbService:
    return VecDbService(
        catalog_vect=CatalogVecDbAdapter(faiss_db=catalog_faiss),
        cart_vect=CartVecDbAdapter(faiss_db=cart_faiss, username="mario"),
        cart_service=mock_cart_service,
        catalog_repo=mock_catalog_repo,
        embedder=mock_embedder,
    )
