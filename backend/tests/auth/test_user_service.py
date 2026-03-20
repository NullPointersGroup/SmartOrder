from unittest.mock import MagicMock

import pytest

from src.auth.exceptions import (
    EmailAlreadyExistsError,
    InvalidEmailFormatError,
    UserCreationError,
    UsernameAlreadyExistsError,
)
from src.auth.models import User, UserRegistration
from src.auth.UserService import UserService


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def repo():
    mock = MagicMock()
    mock.username_exists.return_value      = False
    mock.email_exists.return_value         = False
    mock.email_domain_exists               = MagicMock(return_value=True)
    mock.add_user.return_value             = True
    mock.check_user.return_value           = True
    return mock

@pytest.fixture
def service(repo):
    return UserService(repo)

@pytest.fixture
def valid_user():
    return User(username="testuser", password="Password1!")

@pytest.fixture
def valid_registration():
    return UserRegistration(
        username="testuser",
        email="test@test.com",
        password="Password1!",
        confirm_pwd="Password1!",
    )


# ---------------------------------------------------------------------------
# check_user
# ---------------------------------------------------------------------------

class TestCheckUser:
    def test_returns_true_with_valid_credentials(self, service, repo, valid_user):
        repo.check_user.return_value = True
        assert service.check_user(valid_user) is True

    def test_returns_false_with_wrong_credentials(self, service, repo, valid_user):
        repo.check_user.return_value = False
        assert service.check_user(valid_user) is False

    def test_delegates_to_repo(self, service, repo, valid_user):
        service.check_user(valid_user)
        repo.check_user.assert_called_once_with(valid_user)


# ---------------------------------------------------------------------------
# register_user
# ---------------------------------------------------------------------------

class TestRegisterUser:
    def test_success_returns_true(self, service, valid_registration):
        assert service.register_user(valid_registration) is True

    def test_calls_add_user_on_success(self, service, repo, valid_registration):
        service.register_user(valid_registration)
        repo.add_user.assert_called_once_with(valid_registration)

    def test_raises_if_username_exists(self, service, repo, valid_registration):
        repo.username_exists.return_value = True
        with pytest.raises(UsernameAlreadyExistsError):
            service.register_user(valid_registration)

    def test_does_not_call_add_user_if_username_exists(self, service, repo, valid_registration):
        repo.username_exists.return_value = True
        with pytest.raises(UsernameAlreadyExistsError):
            service.register_user(valid_registration)
        repo.add_user.assert_not_called()

    def test_raises_if_email_domain_invalid(self, service, repo, valid_registration):
        repo.email_domain_exists = MagicMock(return_value=False)
        with pytest.raises(InvalidEmailFormatError):
            service.register_user(valid_registration)

    def test_raises_if_email_exists(self, service, repo, valid_registration):
        repo.email_exists.return_value = True
        with pytest.raises(EmailAlreadyExistsError):
            service.register_user(valid_registration)

    def test_raises_if_add_user_fails(self, service, repo, valid_registration):
        repo.add_user.return_value = False
        with pytest.raises(UserCreationError):
            service.register_user(valid_registration)

    def test_username_check_before_email_domain(self, service, repo, valid_registration):
        repo.username_exists.return_value = True
        repo.email_domain_exists          = MagicMock(return_value=False)
        with pytest.raises(UsernameAlreadyExistsError):
            service.register_user(valid_registration)
        repo.email_domain_exists.assert_not_called()

    def test_email_domain_check_before_email_exists(self, service, repo, valid_registration):
        repo.email_domain_exists = MagicMock(return_value=False)
        repo.email_exists.return_value = True
        with pytest.raises(InvalidEmailFormatError):
            service.register_user(valid_registration)
        repo.email_exists.assert_not_called()