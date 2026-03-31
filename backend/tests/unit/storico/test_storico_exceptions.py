import pytest

from src.storico.exceptions import OrdiniNotFoundException, StoricoAccessDeniedException


class TestOrdiniNotFoundException:
    def test_is_exception(self):
        assert isinstance(OrdiniNotFoundException("user1"), Exception)

    def test_message_contains_username(self):
        exc = OrdiniNotFoundException("mario")
        assert "mario" in exc.message

    def test_message_format(self):
        exc = OrdiniNotFoundException("mario")
        assert exc.message == "Nessun ordine trovato per l'utente 'mario'"

    def test_str_equals_message(self):
        exc = OrdiniNotFoundException("mario")
        assert str(exc) == exc.message

    def test_can_be_raised_and_caught(self):
        with pytest.raises(OrdiniNotFoundException):
            raise OrdiniNotFoundException("mario")

    def test_different_usernames_produce_different_messages(self):
        exc1 = OrdiniNotFoundException("mario")
        exc2 = OrdiniNotFoundException("luigi")
        assert exc1.message != exc2.message


class TestStoricoAccessDeniedException:
    def test_is_exception(self):
        assert isinstance(StoricoAccessDeniedException(), Exception)

    def test_message(self):
        exc = StoricoAccessDeniedException()
        assert exc.message == "Accesso non autorizzato allo storico ordini"

    def test_str_equals_message(self):
        exc = StoricoAccessDeniedException()
        assert str(exc) == exc.message

    def test_can_be_raised_and_caught(self):
        with pytest.raises(StoricoAccessDeniedException):
            raise StoricoAccessDeniedException()

    def test_is_not_ordini_not_found(self):
        assert not isinstance(StoricoAccessDeniedException(), OrdiniNotFoundException)
