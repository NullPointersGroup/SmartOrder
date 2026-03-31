from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI, HTTPException, status
from fastapi.testclient import TestClient

from src.storico.StoricoApi import router, _get_username, _get_service, _require_admin
from src.storico.StoricoSchemas import OrdineSchema, StoricoResponseSchema
from src.storico.exceptions import OrdiniNotFoundException

app = FastAPI()
app.include_router(router)


def make_storico_response(n: int = 2) -> StoricoResponseSchema:
    ordini = [
        OrdineSchema(
            id=i,
            username="mario",
            stato="completato",
            totale=50.0 * i,
            created_at=datetime(2024, 1, i + 1, 10, 0, 0),
            prodotti=[],
        )
        for i in range(1, n + 1)
    ]
    return StoricoResponseSchema(ordini=ordini, totale_ordini=n)


def override_username() -> str:
    return "mario"


def override_admin() -> str:
    return "admin_user"


def override_admin_forbidden() -> str:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Accesso riservato agli amministratori",
    )


def override_user_not_found() -> str:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Utente non trovato",
    )


class TestGetStoricoCliente:
    def test_returns_200_with_valid_token(self):
        svc = MagicMock()
        svc.get_ordini_cliente.return_value = make_storico_response()

        app.dependency_overrides[_get_username] = override_username
        app.dependency_overrides[_get_service] = lambda: svc

        response = TestClient(app).get("/storico/cliente")

        app.dependency_overrides.clear()
        assert response.status_code == 200

    def test_response_contains_ordini_and_totale(self):
        svc = MagicMock()
        svc.get_ordini_cliente.return_value = make_storico_response(3)

        app.dependency_overrides[_get_username] = override_username
        app.dependency_overrides[_get_service] = lambda: svc

        response = TestClient(app).get("/storico/cliente")

        app.dependency_overrides.clear()
        data = response.json()
        assert "ordini" in data
        assert "totale_ordini" in data
        assert data["totale_ordini"] == 3

    def test_returns_404_when_no_ordini(self):
        svc = MagicMock()
        svc.get_ordini_cliente.side_effect = OrdiniNotFoundException("mario")

        app.dependency_overrides[_get_username] = override_username
        app.dependency_overrides[_get_service] = lambda: svc

        response = TestClient(app).get("/storico/cliente")

        app.dependency_overrides.clear()
        assert response.status_code == 404

    def test_404_detail_contains_username(self):
        svc = MagicMock()
        svc.get_ordini_cliente.side_effect = OrdiniNotFoundException("mario")

        app.dependency_overrides[_get_username] = override_username
        app.dependency_overrides[_get_service] = lambda: svc

        response = TestClient(app).get("/storico/cliente")

        app.dependency_overrides.clear()
        assert "mario" in response.json()["detail"]

    def test_returns_401_without_token(self):
        app.dependency_overrides.clear()
        response = TestClient(app).get("/storico/cliente")
        assert response.status_code == 401

    def test_returns_401_with_invalid_token(self):
        app.dependency_overrides.clear()
        with patch("src.storico.StoricoApi.TokenUtility.decode_token", return_value=None):
            response = TestClient(app).get(
                "/storico/cliente",
                headers={"Authorization": "Bearer token.non.valido"},
            )
        assert response.status_code == 401


class TestGetStoricoAdmin:
    def test_returns_200_for_admin(self):
        svc = MagicMock()
        svc.get_ordini_admin.return_value = make_storico_response(5)

        app.dependency_overrides[_require_admin] = override_admin
        app.dependency_overrides[_get_service] = lambda: svc

        response = TestClient(app).get("/storico/admin")

        app.dependency_overrides.clear()
        assert response.status_code == 200

    def test_response_contains_all_ordini(self):
        svc = MagicMock()
        svc.get_ordini_admin.return_value = make_storico_response(5)

        app.dependency_overrides[_require_admin] = override_admin
        app.dependency_overrides[_get_service] = lambda: svc

        response = TestClient(app).get("/storico/admin")

        app.dependency_overrides.clear()
        data = response.json()
        assert data["totale_ordini"] == 5
        assert len(data["ordini"]) == 5

    def test_returns_403_for_non_admin(self):
        svc = MagicMock()

        app.dependency_overrides[_require_admin] = override_admin_forbidden
        app.dependency_overrides[_get_service] = lambda: svc

        response = TestClient(app).get("/storico/admin")

        app.dependency_overrides.clear()
        assert response.status_code == 403
        assert response.json()["detail"] == "Accesso riservato agli amministratori"

    def test_returns_403_when_user_not_found(self):
        svc = MagicMock()

        app.dependency_overrides[_require_admin] = override_user_not_found
        app.dependency_overrides[_get_service] = lambda: svc

        response = TestClient(app).get("/storico/admin")

        app.dependency_overrides.clear()
        assert response.status_code == 403
        assert response.json()["detail"] == "Utente non trovato"

    def test_admin_empty_storico_returns_200(self):
        svc = MagicMock()
        svc.get_ordini_admin.return_value = StoricoResponseSchema(
            ordini=[], totale_ordini=0
        )

        app.dependency_overrides[_require_admin] = override_admin
        app.dependency_overrides[_get_service] = lambda: svc

        response = TestClient(app).get("/storico/admin")

        app.dependency_overrides.clear()
        assert response.status_code == 200
        assert response.json()["totale_ordini"] == 0