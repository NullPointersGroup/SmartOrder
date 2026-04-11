from unittest.mock import MagicMock
import pytest

from src.auth.models import UserRegistration, UserReset
from src.auth.UserRepository import UserRepository
from src.db.models import Utentiweb


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def executor():
    return MagicMock()


@pytest.fixture
def repo(executor):
    r = UserRepository.__new__(UserRepository)
    r.executor = executor
    return r


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


@pytest.fixture
def valid_reset():
    return UserReset(
        username="testuser",
        password="oldpassword",
        new_pwd="newpassword",
        admin=False,
    )


# ---------------------------------------------------------------------------
# find_by_username
# ---------------------------------------------------------------------------

class TestFindByUsername:
    #TU-B_112
    def test_returns_utente_when_found(self, repo, executor, mock_utente):
        executor.execute_one_raw.return_value = mock_utente
        result = repo.find_by_username("testuser")
        assert result is mock_utente

    #TU-B_113
    def test_returns_none_when_not_found(self, repo, executor):
        executor.execute_one_raw.return_value = None
        result = repo.find_by_username("nonexistent")
        assert result is None

    #TU-B_114
    def test_delegates_to_executor(self, repo, executor):
        executor.execute_one_raw.return_value = None
        repo.find_by_username("testuser")
        executor.execute_one_raw.assert_called_once()


# ---------------------------------------------------------------------------
# find_by_email
# ---------------------------------------------------------------------------

class TestFindByEmail:
    #TU-B_115
    def test_returns_utente_when_found(self, repo, executor, mock_utente):
        executor.execute_one_raw.return_value = mock_utente
        result = repo.find_by_email("test@test.com")
        assert result is mock_utente

    #TU-B_116
    def test_returns_none_when_not_found(self, repo, executor):
        executor.execute_one_raw.return_value = None
        result = repo.find_by_email("nonexistent@test.com")
        assert result is None

    #TU-B_117
    def test_delegates_to_executor(self, repo, executor):
        executor.execute_one_raw.return_value = None
        repo.find_by_email("test@test.com")
        executor.execute_one_raw.assert_called_once()


# ---------------------------------------------------------------------------
# save
# ---------------------------------------------------------------------------

class TestSave:
    #TU-B_118
    def test_returns_true_on_success(self, repo, executor, valid_registration):
        executor.mutate_raw.return_value = True
        assert repo.save(valid_registration) is True

    #TU-B_119
    def test_returns_false_on_failure(self, repo, executor, valid_registration):
        executor.mutate_raw.return_value = False
        assert repo.save(valid_registration) is False

    #TU-B_120
    def test_delegates_to_executor(self, repo, executor, valid_registration):
        executor.mutate_raw.return_value = True
        repo.save(valid_registration)
        executor.mutate_raw.assert_called_once()


# ---------------------------------------------------------------------------
# delete
# ---------------------------------------------------------------------------

class TestDelete:
    #TU-B_121
    def test_returns_true_on_success(self, repo, executor):
        executor.mutate_raw.return_value = True
        assert repo.delete("testuser") is True

    #TU-B_122
    def test_returns_false_on_failure(self, repo, executor):
        executor.mutate_raw.return_value = False
        assert repo.delete("testuser") is False

    #TU-B_123
    def test_delegates_to_executor(self, repo, executor):
        executor.mutate_raw.return_value = True
        repo.delete("testuser")
        executor.mutate_raw.assert_called_once()


# ---------------------------------------------------------------------------
# reset_password
# ---------------------------------------------------------------------------

class TestResetPassword:
    #TU-B_124
    def test_returns_true_on_success(self, repo, executor, valid_reset):
        executor.mutate_raw.return_value = True
        assert repo.reset_password(valid_reset) is True

    #TU-B_125
    def test_returns_false_on_failure(self, repo, executor, valid_reset):
        executor.mutate_raw.return_value = False
        assert repo.reset_password(valid_reset) is False

    #TU-B_126
    def test_delegates_to_executor(self, repo, executor, valid_reset):
        executor.mutate_raw.return_value = True
        repo.reset_password(valid_reset)
        executor.mutate_raw.assert_called_once()