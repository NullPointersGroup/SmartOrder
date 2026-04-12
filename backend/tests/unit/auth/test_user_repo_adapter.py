from unittest.mock import MagicMock, patch
import pytest

from src.auth.UserRepoAdapter import UserRepoAdapter
from src.auth.models import UserRegistration, UserReset
from src.db.models import WebUser


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def repo(db):
    return UserRepoAdapter(db)


@pytest.fixture
def mock_utente():
    u = MagicMock(spec=WebUser)
    u.username = "testuser"
    u.password = "hashed_password"
    u.email = "test@test.com"
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


@pytest.fixture
def valid_reset():
    return UserReset(
        username="testuser",
        password="oldpassword",
        new_pwd="newpassword",
        admin=False,
    )


class TestFindByUsername:
    #TU-B_97
    def test_returns_utente_when_found(self, repo, db, mock_utente):
        db.exec.return_value.first.return_value = mock_utente
        result = repo.find_by_username("testuser")
        assert result == mock_utente

    #TU-B_98
    def test_returns_none_when_not_found(self, repo, db):
        db.exec.return_value.first.return_value = None
        assert repo.find_by_username("ghost") is None


class TestEmailExists:
    #TU-B_101
    def test_returns_true_when_found(self, repo, db, mock_utente):
        db.exec.return_value.first.return_value = mock_utente
        assert repo.email_exists("test@test.com") is True

    #TU-B_102
    def test_returns_false_when_not_found(self, repo, db):
        db.exec.return_value.first.return_value = None
        assert repo.email_exists("test@test.com") is False


class TestAddUser:
    #TU-B_103
    def test_returns_true_on_success(self, repo, db, valid_registration):
        repo.repo.save = MagicMock(return_value=True)
        assert repo.add_user(valid_registration) is True

    #TU-B_104
    def test_returns_false_on_failure(self, repo, db, valid_registration):
        repo.repo.save = MagicMock(return_value=False)
        assert repo.add_user(valid_registration) is False


class TestDeleteUser:
    #TU-B_108
    def test_returns_true_on_success(self, repo, db):
        repo.repo.delete = MagicMock(return_value=True)
        assert repo.delete_user("testuser") is True

    #TU-B_109
    def test_returns_false_on_failure(self, repo, db):
        repo.repo.delete = MagicMock(return_value=False)
        assert repo.delete_user("testuser") is False


class TestResetPassword:
    #TU-B_110
    def test_returns_true_on_success(self, repo, db, valid_reset):
        repo.repo.reset_password = MagicMock(return_value=True)
        assert repo.reset_password(valid_reset) is True

    #TU-B_111
    def test_returns_false_on_failure(self, repo, db, valid_reset):
        repo.repo.reset_password = MagicMock(return_value=False)
        assert repo.reset_password(valid_reset) is False
