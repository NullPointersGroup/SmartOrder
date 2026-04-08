from unittest.mock import MagicMock
import pytest

from src.auth.UserService import UserService
from src.auth.models import User, UserRegistration
from src.auth.exceptions import (
    InvalidCredentialsError,
    UsernameAlreadyExistsError,
    InvalidEmailFormatError,
    EmailAlreadyExistsError,
    UserCreationError,
    UserNotFoundError,
    UserDeletionError,
)
from src.db.models import Utentiweb


@pytest.fixture
def repo():
    return MagicMock()


@pytest.fixture
def email_validator():
    return MagicMock()


@pytest.fixture
def service(repo, email_validator):
    return UserService(repo=repo, email_validator=email_validator)


@pytest.fixture
def valid_user():
    return User(username="testuser", password="Password1!", admin=None)


@pytest.fixture
def mock_utente():
    u = MagicMock(spec=Utentiweb)
    u.username = "testuser"
    u.password = "hashed_password"
    return u


@pytest.fixture
def valid_registration():
    return UserRegistration(
        username="testuser",
        email="test@test.com",
        password="Password1!",
        confirm_pwd="Password1!",
        admin=False,
    )


class TestCheckUser:
    #TU-B_122
    def test_returns_username_with_valid_credentials(
        self, service, repo, valid_user, mock_utente
    ):
        repo.find_by_username.return_value = mock_utente
        with patch_verify(True):
            assert service.check_user(valid_user) == "testuser"

    #TU-B_123
    def test_raises_when_user_not_found(self, service, repo, valid_user):
        repo.find_by_username.return_value = None
        with pytest.raises(InvalidCredentialsError):
            service.check_user(valid_user)

    #TU-B_124
    def test_raises_when_password_wrong(self, service, repo, valid_user, mock_utente):
        repo.find_by_username.return_value = mock_utente
        with patch_verify(False):
            with pytest.raises(InvalidCredentialsError):
                service.check_user(valid_user)


class TestRegisterUser:
    #TU-B_125
    def test_succeeds_with_valid_data(
        self, service, repo, email_validator, valid_registration
    ):
        repo.username_exists.return_value = False
        repo.email_exists.return_value = False
        repo.add_user.return_value = True
        email_validator.domain_exists.return_value = True
        service.register_user(valid_registration)

    #TU-B_126
    def test_raises_when_username_exists(self, service, repo, valid_registration):
        repo.username_exists.return_value = True
        with pytest.raises(UsernameAlreadyExistsError):
            service.register_user(valid_registration)

    #TU-B_127
    def test_raises_when_email_domain_invalid(
        self, service, repo, email_validator, valid_registration
    ):
        repo.username_exists.return_value = False
        email_validator.domain_exists.return_value = False
        with pytest.raises(InvalidEmailFormatError):
            service.register_user(valid_registration)

    #TU-B_128
    def test_raises_when_email_exists(
        self, service, repo, email_validator, valid_registration
    ):
        repo.username_exists.return_value = False
        email_validator.domain_exists.return_value = True
        repo.email_exists.return_value = True
        with pytest.raises(EmailAlreadyExistsError):
            service.register_user(valid_registration)

    #TU-B_129
    def test_raises_when_add_user_fails(
        self, service, repo, email_validator, valid_registration
    ):
        repo.username_exists.return_value = False
        email_validator.domain_exists.return_value = True
        repo.email_exists.return_value = False
        repo.add_user.return_value = False
        with pytest.raises(UserCreationError):
            service.register_user(valid_registration)


class TestDeleteUser:
    #TU-B_130
    def test_succeeds_when_user_exists(self, service, repo, mock_utente):
        repo.find_by_username.return_value = mock_utente
        repo.delete_user.return_value = True
        service.delete_user("testuser")

    #TU-B_131
    def test_raises_when_user_not_found(self, service, repo):
        repo.find_by_username.return_value = None
        with pytest.raises(UserNotFoundError):
            service.delete_user("testuser")

    #TU-B_132
    def test_raises_when_delete_fails(self, service, repo, mock_utente):
        repo.find_by_username.return_value = mock_utente
        repo.delete_user.return_value = False
        with pytest.raises(UserDeletionError):
            service.delete_user("testuser")


from unittest.mock import patch

#TU-B_360
def patch_verify(return_value: bool):
    return patch(
        "src.auth.UserService.PasswordUtility.verify_password",
        return_value=return_value,
    )

