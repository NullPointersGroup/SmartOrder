import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from fastapi import FastAPI

from src.storico.StoricoApi import router, get_service, require_admin
from src.auth.api import get_current_user
from src.storico.StoricoSchemas import StoricoPageSchema, OrdineSchema, ProdottoSchema
from src.storico.exceptions import OrdiniNotFoundException, OrdineNotFoundException

# ─── App di test ─────────────────────────────────────────────────────────────

app = FastAPI()
app.include_router(router)

# ─── Fixtures ────────────────────────────────────────────────────────────────

PAGINA_VUOTA = StoricoPageSchema(ordini=[], pagina_corrente=1, totale_pagine=1)

PRODOTTO = ProdottoSchema(nome="Prodotto A", quantita=2)

PAGINA_CON_ORDINI = StoricoPageSchema(
    ordini=[
        OrdineSchema(
            codice_ordine="1",
            data="2024-01-01",
            username=None,
            prodotti=[PRODOTTO],
        )
    ],
    pagina_corrente=1,
    totale_pagine=3,
)

PAGINA_ADMIN = StoricoPageSchema(
    ordini=[
        OrdineSchema(
            codice_ordine="2",
            data="2024-02-01",
            username="cliente1",
            prodotti=[PRODOTTO],
        )
    ],
    pagina_corrente=1,
    totale_pagine=2,
)


def mock_service(page: StoricoPageSchema = PAGINA_CON_ORDINI) -> MagicMock:
    service = MagicMock()
    service.get_ordini_cliente.return_value = page
    service.get_ordini_admin.return_value = PAGINA_ADMIN
    service.duplica_ordine.return_value = None
    return service


# ─── Helper per override ──────────────────────────────────────────────────────

def override_user(username: str = "utente1"):
    app.dependency_overrides[get_current_user] = lambda: username


def override_service(service: MagicMock):
    app.dependency_overrides[get_service] = lambda: service


def override_admin(ok: bool = True, username: str = "admin1"):
    if ok:
        app.dependency_overrides[require_admin] = lambda: username
    else:
        from fastapi import HTTPException, status
        def deny():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accesso riservato agli amministratori")
        app.dependency_overrides[require_admin] = deny


@pytest.fixture(autouse=True)
def clear_overrides():
    yield
    app.dependency_overrides.clear()


client = TestClient(app, raise_server_exceptions=False)

# ─── GET /storico/miei ────────────────────────────────────────────────────────

class TestGetStoricoCliente:

    def test_restituisce_ordini(self):
        service = mock_service()
        override_user()
        override_service(service)

        res = client.get("/storico/miei")

        assert res.status_code == 200
        body = res.json()
        assert body["pagina_corrente"] == 1
        assert body["totale_pagine"] == 3
        assert len(body["ordini"]) == 1
        assert body["ordini"][0]["codice_ordine"] == "1"

    def test_chiama_service_con_username_corretto(self):
        service = mock_service()
        override_user("mario")
        override_service(service)

        client.get("/storico/miei?pagina=2&per_pagina=5")

        service.get_ordini_cliente.assert_called_once_with("mario", 2, 5)

    def test_404_se_nessun_ordine(self):
        service = mock_service()
        service.get_ordini_cliente.side_effect = OrdiniNotFoundException("mario")
        override_user("mario")
        override_service(service)

        res = client.get("/storico/miei")

        assert res.status_code == 404

    def test_pagina_minima_1(self):
        override_user()
        override_service(mock_service())

        res = client.get("/storico/miei?pagina=0")

        assert res.status_code == 422

    def test_per_pagina_massimo_50(self):
        override_user()
        override_service(mock_service())

        res = client.get("/storico/miei?per_pagina=51")

        assert res.status_code == 422


# ─── GET /storico/tutti ───────────────────────────────────────────────────────

class TestGetStoricoAdmin:

    def test_restituisce_tutti_gli_ordini(self):
        service = mock_service()
        override_admin(ok=True)
        override_service(service)

        res = client.get("/storico/tutti")

        assert res.status_code == 200
        body = res.json()
        assert body["ordini"][0]["username"] == "cliente1"

    def test_chiama_service_con_paginazione(self):
        service = mock_service()
        override_admin(ok=True)
        override_service(service)

        client.get("/storico/tutti?pagina=2&per_pagina=20")

        service.get_ordini_admin.assert_called_once_with(2, 20)

    def test_403_se_non_admin(self):
        override_admin(ok=False)
        override_service(mock_service())

        res = client.get("/storico/tutti")

        assert res.status_code == 403

    def test_pagina_minima_1(self):
        override_admin(ok=True)
        override_service(mock_service())

        res = client.get("/storico/tutti?pagina=0")

        assert res.status_code == 422


# ─── POST /storico/duplica/{codice_ordine} ────────────────────────────────────

class TestDuplicaOrdine:

    def test_duplica_con_successo(self):
        service = mock_service()
        override_user("mario")
        override_service(service)

        res = client.post("/storico/duplica/42")

        assert res.status_code == 201
        assert res.json() == {"detail": "Ordine duplicato con successo"}

    def test_chiama_service_con_parametri_corretti(self):
        service = mock_service()
        override_user("mario")
        override_service(service)

        client.post("/storico/duplica/99")

        service.duplica_ordine.assert_called_once_with("99", "mario")

    def test_404_se_ordine_non_trovato(self):
        service = mock_service()
        service.duplica_ordine.side_effect = OrdineNotFoundException("99")
        override_user("mario")
        override_service(service)

        res = client.post("/storico/duplica/99")

        assert res.status_code == 404