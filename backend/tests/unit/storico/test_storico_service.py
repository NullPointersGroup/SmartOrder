from unittest.mock import MagicMock
from datetime import datetime

import pytest

from src.storico.StoricoService import StoricoService
from src.storico.StoricoModels import Ordine
from src.storico.StoricoSchemas import OrdineSchema, StoricoResponseSchema
from src.storico.exceptions import OrdiniNotFoundException


def make_ordine(id: int, username: str, totale: float = 100.0) -> Ordine:
    o = Ordine(
        id=id,
        username=username,
        stato="completato",
        totale=totale,
        created_at=datetime(2024, 1, 1, 12, 0, 0),
    )
    return o


@pytest.fixture
def repo():
    return MagicMock()


@pytest.fixture
def service(repo):
    return StoricoService(repo)


class TestGetOrdiniCliente:
    def test_returns_storico_response_schema(self, service, repo):
        repo.get_ordini_by_username.return_value = [make_ordine(1, "mario")]
        result = service.get_ordini_cliente("mario")
        assert isinstance(result, StoricoResponseSchema)

    def test_totale_ordini_matches_list_length(self, service, repo):
        repo.get_ordini_by_username.return_value = [
            make_ordine(1, "mario"),
            make_ordine(2, "mario"),
        ]
        result = service.get_ordini_cliente("mario")
        assert result.totale_ordini == 2

    def test_ordini_are_ordine_schema_instances(self, service, repo):
        repo.get_ordini_by_username.return_value = [make_ordine(1, "mario")]
        result = service.get_ordini_cliente("mario")
        assert all(isinstance(o, OrdineSchema) for o in result.ordini)

    def test_single_ordine_data_is_correct(self, service, repo):
        repo.get_ordini_by_username.return_value = [make_ordine(1, "mario", totale=99.9)]
        result = service.get_ordini_cliente("mario")
        assert result.ordini[0].totale == pytest.approx(99.9)
        assert result.ordini[0].username == "mario"

    def test_raises_ordini_not_found_when_empty(self, service, repo):
        repo.get_ordini_by_username.return_value = []
        with pytest.raises(OrdiniNotFoundException):
            service.get_ordini_cliente("mario")

    def test_exception_message_contains_username(self, service, repo):
        repo.get_ordini_by_username.return_value = []
        with pytest.raises(OrdiniNotFoundException) as exc_info:
            service.get_ordini_cliente("mario")
        assert "mario" in exc_info.value.message

    def test_calls_repo_with_correct_username(self, service, repo):
        repo.get_ordini_by_username.return_value = [make_ordine(1, "mario")]
        service.get_ordini_cliente("mario")
        repo.get_ordini_by_username.assert_called_once_with("mario")

    def test_multiple_ordini_all_included(self, service, repo):
        ordini = [make_ordine(i, "mario") for i in range(5)]
        repo.get_ordini_by_username.return_value = ordini
        result = service.get_ordini_cliente("mario")
        assert len(result.ordini) == 5


class TestGetOrdiniAdmin:
    def test_returns_storico_response_schema(self, service, repo):
        repo.get_all_ordini.return_value = [make_ordine(1, "mario")]
        result = service.get_ordini_admin()
        assert isinstance(result, StoricoResponseSchema)

    def test_empty_list_does_not_raise(self, service, repo):
        repo.get_all_ordini.return_value = []
        result = service.get_ordini_admin()
        assert result.totale_ordini == 0
        assert result.ordini == []

    def test_totale_ordini_matches_list_length(self, service, repo):
        repo.get_all_ordini.return_value = [
            make_ordine(1, "mario"),
            make_ordine(2, "luigi"),
            make_ordine(3, "peach"),
        ]
        result = service.get_ordini_admin()
        assert result.totale_ordini == 3

    def test_ordini_are_ordine_schema_instances(self, service, repo):
        repo.get_all_ordini.return_value = [make_ordine(1, "mario"), make_ordine(2, "luigi")]
        result = service.get_ordini_admin()
        assert all(isinstance(o, OrdineSchema) for o in result.ordini)

    def test_calls_get_all_ordini_once(self, service, repo):
        repo.get_all_ordini.return_value = []
        service.get_ordini_admin()
        repo.get_all_ordini.assert_called_once()

    def test_does_not_call_get_by_username(self, service, repo):
        repo.get_all_ordini.return_value = []
        service.get_ordini_admin()
        repo.get_ordini_by_username.assert_not_called()

    def test_ordini_data_preserved(self, service, repo):
        repo.get_all_ordini.return_value = [make_ordine(42, "luigi", totale=55.5)]
        result = service.get_ordini_admin()
        assert result.ordini[0].id == 42
        assert result.ordini[0].totale == pytest.approx(55.5)