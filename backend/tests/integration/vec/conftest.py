from typing import Generator, Any
import pytest
import numpy as np
from sqlmodel import Session, text
from unittest.mock import MagicMock

from src.vec.adapters.FaissCatalogDb import FaissCatalogDb
from src.vec.adapters.FaissCartDb import FaissCartDb
from src.vec.adapters.CatalogVecDbAdapter import CatalogVecDbAdapter
from src.vec.adapters.CartVecDbAdapter import CartVecDbAdapter
from src.vec.VecDbService import VecDbService
from src.catalog.adapters.CatalogRepoAdapter import CatalogRepoAdapter
from src.catalog.adapters.CatalogRepository import CatalogRepository

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

    def embed_fn(text: str) -> np.ndarray:
        # produce un vettore deterministico basato sul testo
        seed = sum(ord(c) for c in text)
        rng = np.random.default_rng(seed)
        return rng.random(DIMENSION).astype(np.float32)

    embedder.embed.side_effect = embed_fn
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
        catalog_vect=CatalogVecDbAdapter(faiss_db=catalog_faiss),  # ← stessa istanza
        cart_vect=CartVecDbAdapter(
            faiss_db=cart_faiss, username="mario"
        ),  # ← stessa istanza
        cart_service=mock_cart_service,
        catalog_repo=mock_catalog_repo,
        embedder=mock_embedder,
    )


@pytest.fixture
def real_vec_service(
    seeded_catalog: Session,
    catalog_faiss: FaissCatalogDb,
    cart_faiss: FaissCartDb,
    mock_embedder: MagicMock,
    mock_cart_service: MagicMock,
) -> VecDbService:
    # catalog_repo REALE — legge dal DB PostgreSQL di test
    catalog_repo = CatalogRepoAdapter(CatalogRepository(seeded_catalog))
    return VecDbService(
        catalog_vect=CatalogVecDbAdapter(faiss_db=catalog_faiss),
        cart_vect=CartVecDbAdapter(faiss_db=cart_faiss, username="mario"),
        cart_service=mock_cart_service,  # cart_service ancora mockato
        catalog_repo=catalog_repo,  # ← reale
        embedder=mock_embedder,
    )


@pytest.fixture
def seeded_catalog(db_session: Session) -> Generator[Session, Any, None]:
    """Inserisce prodotti di test nella tabella anaart."""
    db_session.execute(text("""
        INSERT INTO anaart (cod_art, des_art, des_um, tipo_um, des_tipo_um, peso_netto_conf, conf_collo, pezzi_conf, grammatura, prezzo)
        VALUES
            ('ABC1', 'Pasta Barilla', 'KG', 'C', 'CONFEZIONI', 0.5, 12.0, 12.0, 500.0, 1.20),
            ('ABC2', 'Acqua Naturale', 'LT', 'C', 'CONFEZIONI', 1.5, 6.0, 6.0, 0.0, 0.50),
            ('ABC3', 'Vino Rosso', 'LT', 'C', 'CONFEZIONI', 0.75, 6.0, 6.0, 0.0, 5.00),
            ('ABC4', 'Olio Extravergine', 'LT', 'C', 'CONFEZIONI', 0.75, 6.0, 6.0, 0.0, 8.00)
    """))
    db_session.commit()
    yield db_session
    db_session.execute(text("DELETE FROM anaart"))
    db_session.commit()
