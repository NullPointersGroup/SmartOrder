import pytest

from src.auth.exceptions import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    InvalidEmailFormatError,
    UserCreationError,
    UsernameAlreadyExistsError,
)


class TestUsernameAlreadyExistsError:
    def test_is_value_error(self):
        assert isinstance(UsernameAlreadyExistsError(), ValueError)

    def test_message(self):
        assert str(UsernameAlreadyExistsError()) == "Username già esistente"

    def test_can_be_raised_and_caught(self):
        with pytest.raises(UsernameAlreadyExistsError):
            raise UsernameAlreadyExistsError()


class TestInvalidEmailFormatError:
    def test_is_value_error(self):
        assert isinstance(InvalidEmailFormatError(), ValueError)

    def test_message(self):
        assert str(InvalidEmailFormatError()) == "L'email non è nel formato corretto"

    def test_can_be_raised_and_caught(self):
        with pytest.raises(InvalidEmailFormatError):
            raise InvalidEmailFormatError()


class TestEmailAlreadyExistsError:
    def test_is_value_error(self):
        assert isinstance(EmailAlreadyExistsError(), ValueError)

    def test_message(self):
        assert str(EmailAlreadyExistsError()) == "Email già esistente"

    def test_can_be_raised_and_caught(self):
        with pytest.raises(EmailAlreadyExistsError):
            raise EmailAlreadyExistsError()


class TestInvalidCredentialsError:
    def test_is_value_error(self):
        assert isinstance(InvalidCredentialsError(), ValueError)

    def test_message(self):
        assert str(InvalidCredentialsError()) == "Username o password errati"

    def test_can_be_raised_and_caught(self):
        with pytest.raises(InvalidCredentialsError):
            raise InvalidCredentialsError()


class TestUserCreationError:
    def test_is_exception(self):
        assert isinstance(UserCreationError(), Exception)

    def test_is_not_value_error(self):
        # UserCreationError è un errore di sistema, non di validazione
        assert not isinstance(UserCreationError(), ValueError)

    def test_message(self):
        assert str(UserCreationError()) == "Errore durante la registrazione"

    def test_can_be_raised_and_caught(self):
        with pytest.raises(UserCreationError):
            raise UserCreationError()