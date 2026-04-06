from unittest.mock import MagicMock, patch
import pytest

from src.auth.UserRepoAdapter import UserRepoAdapter
from src.auth.models import UserRegistration
from src.db.models import Utentiweb


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def repo(db):
    return UserRepoAdapter(db)


@pytest.fixture
def mock_utente():
    u = MagicMock(spec=Utentiweb)
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


class TestUsernameExists:
    #TU-B_99
    def test_returns_true_when_found(self, repo, db, mock_utente):
        db.exec.return_value.first.return_value = mock_utente
        assert repo.username_exists("testuser") is True

    #TU-B_100
    def test_returns_false_when_not_found(self, repo, db):
        db.exec.return_value.first.return_value = None
        assert repo.username_exists("testuser") is False


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
        with patch(
            "src.auth.UserRepository.PasswordUtility.hash_password",
            return_value="hashed",
        ):
            assert repo.add_user(valid_registration) is True

    #TU-B_104
    def test_commits_on_success(self, repo, db, valid_registration):
        with patch(
            "src.auth.UserRepository.PasswordUtility.hash_password",
            return_value="hashed",
        ):
            repo.add_user(valid_registration)
        db.commit.assert_called_once()

    #TU-B_105
    def test_returns_false_on_exception(self, repo, db, valid_registration):
        db.exec.side_effect = Exception("db error")
        with patch(
            "src.auth.UserRepository.PasswordUtility.hash_password",
            return_value="hashed",
        ):
            assert repo.add_user(valid_registration) is False

    #TU-B_106
    def test_rollback_on_exception(self, repo, db, valid_registration):
        db.exec.side_effect = Exception("db error")
        with patch(
            "src.auth.UserRepository.PasswordUtility.hash_password",
            return_value="hashed",
        ):
            repo.add_user(valid_registration)
        db.rollback.assert_called_once()
        db.commit.assert_not_called()

    #TU-B_107
    def test_password_is_hashed(self, repo, db, valid_registration):
        with patch(
            "src.auth.UserRepository.PasswordUtility.hash_password",
            return_value="hashed",
        ) as mock_hash:
            repo.add_user(valid_registration)
            mock_hash.assert_called_once_with(valid_registration.password)


class TestDeleteUser:
    #TU-B_108
    def test_returns_true_on_success(self, repo, db):
        db.exec.return_value
        assert repo.delete_user("testuser") is True

    #TU-B_109
    def test_returns_false_on_exception(self, repo, db):
        db.exec.side_effect = Exception("db error")
        assert repo.delete_user("testuser") is False

    #TU-B_110
    def test_rollback_on_exception(self, repo, db):
        db.exec.side_effect = Exception("db error")
        repo.delete_user("testuser")
        db.rollback.assert_called_once()
        db.commit.assert_not_called()

    #TU-B_111
    def test_commits_on_success(self, repo, db):
        repo.delete_user("testuser")
        db.commit.assert_called_once()

