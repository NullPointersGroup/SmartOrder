import pytest

from src.auth.exceptions import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    InvalidEmailFormatError,
    UserCreationError,
    UsernameAlreadyExistsError,
)


class TestUsernameAlreadyExistsError:
    #TU_22
    def test_is_value_error(self):
        assert isinstance(UsernameAlreadyExistsError(), ValueError)

    #TU_23
    def test_message(self):
        assert str(UsernameAlreadyExistsError()) == "Username già esistente"

    #TU_24
    def test_can_be_raised_and_caught(self):
        with pytest.raises(UsernameAlreadyExistsError):
            raise UsernameAlreadyExistsError()


class TestInvalidEmailFormatError:
    #TU_25
    def test_is_value_error(self):
        assert isinstance(InvalidEmailFormatError(), ValueError)

    #TU_26
    def test_message(self):
        assert str(InvalidEmailFormatError()) == "L'email non è nel formato corretto"

    #TU_27
    def test_can_be_raised_and_caught(self):
        with pytest.raises(InvalidEmailFormatError):
            raise InvalidEmailFormatError()


class TestEmailAlreadyExistsError:
    #TU_28
    def test_is_value_error(self):
        assert isinstance(EmailAlreadyExistsError(), ValueError)

    #TU_29
    def test_message(self):
        assert str(EmailAlreadyExistsError()) == "Email già esistente"

    #TU_30
    def test_can_be_raised_and_caught(self):
        with pytest.raises(EmailAlreadyExistsError):
            raise EmailAlreadyExistsError()


class TestInvalidCredentialsError:
    #TU_31
    def test_is_value_error(self):
        assert isinstance(InvalidCredentialsError(), ValueError)

    #TU_32
    def test_message(self):
        assert str(InvalidCredentialsError()) == "Username o password errati"

    #TU_33
    def test_can_be_raised_and_caught(self):
        with pytest.raises(InvalidCredentialsError):
            raise InvalidCredentialsError()


class TestUserCreationError:
    #TU_34
    def test_is_exception(self):
        assert isinstance(UserCreationError(), Exception)

    #TU_35
    def test_is_not_value_error(self):
        # UserCreationError è un errore di sistema, non di validazione
        assert not isinstance(UserCreationError(), ValueError)

    #TU_36
    def test_message(self):
        assert str(UserCreationError()) == "Errore durante la registrazione"

    #TU_37
    def test_can_be_raised_and_caught(self):
        with pytest.raises(UserCreationError):
            raise UserCreationError()