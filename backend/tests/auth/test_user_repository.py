from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.auth.models import User, UserRegistration
from src.auth.UserRepository import UserRepository
from src.db.models import Utente


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def db():
    return MagicMock()

@pytest.fixture
def repo(db):
    return UserRepository(db)

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

@pytest.fixture
def mock_utente():
    u = MagicMock(spec=Utente)
    u.username = "testuser"
    u.password = "hashed_password"
    u.email    = "test@test.com"
    return u


# ---------------------------------------------------------------------------
# check_user
# ---------------------------------------------------------------------------

class TestCheckUser:
    def test_returns_true_with_valid_credentials(self, repo, db, valid_user, mock_utente):
        db.exec.return_value.first.return_value = mock_utente
        with patch("src.auth.UserRepository.PasswordService.verify_password", return_value=True):
            assert repo.check_user(valid_user) is True

    def test_returns_false_with_wrong_password(self, repo, db, valid_user, mock_utente):
        db.exec.return_value.first.return_value = mock_utente
        with patch("src.auth.UserRepository.PasswordService.verify_password", return_value=False):
            assert repo.check_user(valid_user) is False

    def test_returns_false_when_user_not_found(self, repo, db, valid_user):
        db.exec.return_value.first.return_value = None
        assert repo.check_user(valid_user) is False

    def test_returns_false_when_password_is_none(self, repo, db, valid_user, mock_utente):
        mock_utente.password = None
        db.exec.return_value.first.return_value = mock_utente
        assert repo.check_user(valid_user) is False

    def test_does_not_call_verify_when_user_not_found(self, repo, db, valid_user):
        db.exec.return_value.first.return_value = None
        with patch("src.auth.UserRepository.PasswordService.verify_password") as mock_verify:
            repo.check_user(valid_user)
            mock_verify.assert_not_called()


# ---------------------------------------------------------------------------
# username_exists
# ---------------------------------------------------------------------------

class TestUsernameExists:
    def test_returns_true_when_found(self, repo, db):
        db.exec.return_value.first.return_value = MagicMock()
        assert repo.username_exists("testuser") is True

    def test_returns_false_when_not_found(self, repo, db):
        db.exec.return_value.first.return_value = None
        assert repo.username_exists("testuser") is False


# ---------------------------------------------------------------------------
# email_exists
# ---------------------------------------------------------------------------

class TestEmailExists:
    def test_returns_true_when_found(self, repo, db):
        db.exec.return_value.first.return_value = MagicMock()
        assert repo.email_exists("test@test.com") is True

    def test_returns_false_when_not_found(self, repo, db):
        db.exec.return_value.first.return_value = None
        assert repo.email_exists("test@test.com") is False


# ---------------------------------------------------------------------------
# email_domain_exists
# ---------------------------------------------------------------------------

class TestEmailDomainExists:
    async def test_returns_true_when_mx_record_found(self, repo):
        with patch("src.auth.UserRepository.dns.resolver.resolve"):
            assert await repo.email_domain_exists("test@test.com") is True

    async def test_returns_false_when_mx_record_not_found(self, repo):
        with patch("src.auth.UserRepository.dns.resolver.resolve", side_effect=Exception()):
            assert await repo.email_domain_exists("test@invalid-domain.xyz") is False

    async def test_extracts_domain_from_email(self, repo):
        with patch("src.auth.UserRepository.dns.resolver.resolve") as mock_resolve:
            await repo.email_domain_exists("user@example.com")
            mock_resolve.assert_called_once_with("example.com", "MX")


# ---------------------------------------------------------------------------
# add_user
# ---------------------------------------------------------------------------

class TestAddUser:
    def test_returns_true_on_success(self, repo, db, valid_registration):
        with patch("src.auth.UserRepository.PasswordService.hash_password", return_value="hashed"):
            assert repo.add_user(valid_registration) is True

    def test_commits_on_success(self, repo, db, valid_registration):
        with patch("src.auth.UserRepository.PasswordService.hash_password", return_value="hashed"):
            repo.add_user(valid_registration)
        db.commit.assert_called_once()

    def test_returns_false_on_exception(self, repo, db, valid_registration):
        db.exec.side_effect = Exception("db error")
        with patch("src.auth.UserRepository.PasswordService.hash_password", return_value="hashed"):
            assert repo.add_user(valid_registration) is False

    def test_rollback_on_exception(self, repo, db, valid_registration):
        db.exec.side_effect = Exception("db error")
        with patch("src.auth.UserRepository.PasswordService.hash_password", return_value="hashed"):
            repo.add_user(valid_registration)
        db.rollback.assert_called_once()
        db.commit.assert_not_called()

    def test_password_is_hashed(self, repo, db, valid_registration):
        with patch("src.auth.UserRepository.PasswordService.hash_password", return_value="hashed") as mock_hash:
            repo.add_user(valid_registration)
            mock_hash.assert_called_once_with(valid_registration.password)