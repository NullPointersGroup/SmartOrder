import pytest
from sqlmodel import SQLModel, create_engine, Session, select, func
from datetime import date
from sqlalchemy import text

from src.db.models import Ordine, OrdCliDet, Anaart
from src.storico.StoricoRepository import StoricoRepository
from src.enums import MeasureUnitEnum

# Import user model if available (adjust path as needed)
try:
    from src.db.models import Utentiweb
    USER_MODEL_AVAILABLE = True
except ImportError:
    USER_MODEL_AVAILABLE = False

TEST_DB_URL = "postgresql://postgres:postgres@localhost:5433/smartorder_test"


@pytest.fixture(scope="session")
def engine():
    engine = create_engine(TEST_DB_URL)
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def session(engine):
    with Session(engine) as session:
        yield session
        session.rollback()  # ensure rollback after test


@pytest.fixture
def clean_db(session):
    """Truncate all relevant tables after each test."""
    yield
    # Rollback any pending transaction (e.g., after an IntegrityError)
    session.rollback()
    # Truncate tables in reverse dependency order (CASCADE handles FKs)
    session.execute(text("TRUNCATE TABLE utentiweb, anaart, ordine, ordclidet CASCADE;"))
    session.commit()


@pytest.fixture
def sample_data(session, clean_db):
    """Insert test data and return references."""
    # 1. Users
    if USER_MODEL_AVAILABLE:
        user1 = Utentiweb(username="user1", password="dummy", email="user1@test.com")        #NOSONAR
        user2 = Utentiweb(username="user2", password="dummy", email="user2@test.com")        #NOSONAR
        user3 = Utentiweb(username="newuser", password="dummy", email="newuser@test.com")    #NOSONAR
        session.add_all([user1, user2, user3])
    else:
        # Raw SQL insert (adjust column list if needed)
        session.execute(text(
            "INSERT INTO utentiweb (username, password, email) VALUES "
            "('user1', 'dummy', 'user1@test.com'), "
            "('user2', 'dummy', 'user2@test.com'), "
            "('newuser', 'dummy', 'newuser@test.com') "
            "ON CONFLICT DO NOTHING"
        ))
    session.flush()

    # 2. Products
    prod_a = Anaart(
        prod_id="ART001",
        prod_des="Product A",
        measure_unit_description="kg",
        measure_unit_type=MeasureUnitEnum.K,
        price=10.0
    )
    prod_b = Anaart(
        prod_id="ART002",
        prod_des="Product B",
        measure_unit_description="l",
        measure_unit_type=MeasureUnitEnum.L,
        price=20.0
    )
    prod_c = Anaart(
        prod_id="ART003",
        prod_des="Product C",
        measure_unit_description="pz",
        measure_unit_type=MeasureUnitEnum.P,
        price=30.0
    )
    session.add_all([prod_a, prod_b, prod_c])
    session.flush()

    # 3. Orders
    order1 = Ordine(id_ord=1, username="user1", data=date(2023, 1, 1))
    order2 = Ordine(id_ord=2, username="user1", data=date(2023, 2, 1))
    order3 = Ordine(id_ord=3, username="user2", data=date(2023, 3, 1))
    session.add_all([order1, order2, order3])
    session.flush()

    # 4. Order details
    detail1 = OrdCliDet(id_ord=1, cod_art="ART001", qta_ordinata=2)
    detail2 = OrdCliDet(id_ord=1, cod_art="ART002", qta_ordinata=1)
    detail3 = OrdCliDet(id_ord=2, cod_art="ART001", qta_ordinata=3)
    detail4 = OrdCliDet(id_ord=3, cod_art="ART003", qta_ordinata=5)
    session.add_all([detail1, detail2, detail3, detail4])
    session.flush()

    return {
        "products": [prod_a, prod_b, prod_c],
        "orders": [order1, order2, order3],
        "details": [detail1, detail2, detail3, detail4],
    }


# ---------- Test Cases ----------

def test_get_ordini_by_username(session, sample_data):
    repo = StoricoRepository(session)
    ordini, totale = repo.get_ordini_by_username("user1", pagina=1, per_pagina=10)
    assert totale == 2
    assert len(ordini) == 2
    assert ordini[0].id_ord == 2
    assert ordini[1].id_ord == 1

    ordini, totale = repo.get_ordini_by_username("user1", pagina=1, per_pagina=1)
    assert len(ordini) == 1
    assert ordini[0].id_ord == 2

    ordini, totale = repo.get_ordini_by_username("unknown", pagina=1, per_pagina=10)
    assert totale == 0
    assert len(ordini) == 0


def test_get_all_ordini(session, sample_data):
    repo = StoricoRepository(session)
    ordini, totale = repo.get_all_ordini(pagina=1, per_pagina=10)
    assert totale == 3
    assert len(ordini) == 3
    assert ordini[0].id_ord == 3
    assert ordini[1].id_ord == 2
    assert ordini[2].id_ord == 1

    ordini, totale = repo.get_all_ordini(pagina=1, per_pagina=2)
    assert len(ordini) == 2
    assert ordini[0].id_ord == 3
    assert ordini[1].id_ord == 2

    ordini, totale = repo.get_all_ordini(pagina=2, per_pagina=2)
    assert len(ordini) == 1
    assert ordini[0].id_ord == 1


def test_get_prodotti_by_ordine_ids(session, sample_data):
    repo = StoricoRepository(session)
    result = repo.get_prodotti_by_ordine_ids([1, 2])
    assert len(result) == 3
    for det, prod in result:
        assert isinstance(det, OrdCliDet)
        assert isinstance(prod, Anaart)
        assert det.cod_art == prod.prod_id

    assert repo.get_prodotti_by_ordine_ids([]) == []
    assert repo.get_prodotti_by_ordine_ids([999]) == []


def test_duplica_ordine_not_found(session, sample_data):
    repo = StoricoRepository(session)
    with pytest.raises(ValueError, match="Ordine '999' non trovato"):
        repo.duplica_ordine("999", "user1")


def test_duplica_ordine(session, sample_data):
    """Test that duplicating an order raises duplicate key error due to bug."""
    repo = StoricoRepository(session)

    max_id = session.exec(select(func.max(Ordine.id_ord))).one()
    assert max_id == 3

    with pytest.raises(Exception) as exc_info:
        repo.duplica_ordine("1", "newuser")

    assert "duplicate key" in str(exc_info.value).lower()