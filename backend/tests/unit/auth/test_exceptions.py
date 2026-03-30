import pytest

from src.auth.exceptions import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    InvalidEmailFormatError,
    UserCreationError,
    UsernameAlreadyExistsError,
)


class TestUsernameAlreadyExistsError:
    #TU-B_22
    def test_is_value_error(self):
        assert isinstance(UsernameAlreadyExistsError(), ValueError)

    #TU-B_23
    def test_message(self):
        assert str(UsernameAlreadyExistsError()) == "Username già esistente"

    #TU-B_24
    def test_can_be_raised_and_caught(self):
        with pytest.raises(UsernameAlreadyExistsError):
            raise UsernameAlreadyExistsError()


class TestInvalidEmailFormatError:
    #TU-B_25
    def test_is_value_error(self):
        assert isinstance(InvalidEmailFormatError(), ValueError)

    #TU-B_26
    def test_message(self):
        assert str(InvalidEmailFormatError()) == "L'email non è nel formato corretto"

    #TU-B_27
    def test_can_be_raised_and_caught(self):
        with pytest.raises(InvalidEmailFormatError):
            raise InvalidEmailFormatError()


class TestEmailAlreadyExistsError:
    #TU-B_28
    def test_is_value_error(self):
        assert isinstance(EmailAlreadyExistsError(), ValueError)

    #TU-B_29
    def test_message(self):
        assert str(EmailAlreadyExistsError()) == "Email già esistente"

    #TU-B_30
    def test_can_be_raised_and_caught(self):
        with pytest.raises(EmailAlreadyExistsError):
            raise EmailAlreadyExistsError()


class TestInvalidCredentialsError:
    #TU-B_31
    def test_is_value_error(self):
        assert isinstance(InvalidCredentialsError(), ValueError)

    #TU-B_32
    def test_message(self):
        assert str(InvalidCredentialsError()) == "Username o password errati"

    #TU-B_33
    def test_can_be_raised_and_caught(self):
        with pytest.raises(InvalidCredentialsError):
            raise InvalidCredentialsError()


class TestUserCreationError:
    #TU-B_34
    def test_is_exception(self):
        assert isinstance(UserCreationError(), Exception)

    #TU-B_35
    def test_is_not_value_error(self):
        # UserCreationError è un errore di sistema, non di validazione
        assert not isinstance(UserCreationError(), ValueError)

    #TU-B_36
    def test_message(self):
        assert str(UserCreationError()) == "Errore durante la registrazione"

    #TU-B_37
    def test_can_be_raised_and_caught(self):
        with pytest.raises(UserCreationError):
            raise UserCreationError()