from unittest.mock import MagicMock, patch

import pytest

from src.auth.models import UserRegistration
from src.auth.UserRepository import UserRepository
from src.db.models import Utente

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
    u = MagicMock(spec=Utente)
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
    )


# ---------------------------------------------------------------------------
# find_by_username
# ---------------------------------------------------------------------------


class TestFindByUsername:
    # TU-B_112
    def test_returns_utente_when_found(self, repo, executor, mock_utente):
        executor.execute_one_raw.return_value = mock_utente
        result = repo.find_by_username("testuser")
        assert result is mock_utente

    # TU-B_113
    def test_returns_none_when_not_found(self, repo, executor):
        executor.execute_one_raw.return_value = None
        result = repo.find_by_username("nonexistent")
        assert result is None

    # TU-B_114
    def test_delegates_to_executor(self, repo, executor):
        executor.execute_one_raw.return_value = None
        repo.find_by_username("testuser")
        executor.execute_one_raw.assert_called_once()


# ---------------------------------------------------------------------------
# find_by_email
# ---------------------------------------------------------------------------


class TestFindByEmail:
    # TU-B_115
    def test_returns_utente_when_found(self, repo, executor, mock_utente):
        executor.execute_one_raw.return_value = mock_utente
        result = repo.find_by_email("test@test.com")
        assert result is mock_utente

    # TU-B_116
    def test_returns_none_when_not_found(self, repo, executor):
        executor.execute_one_raw.return_value = None
        result = repo.find_by_email("nonexistent@test.com")
        assert result is None

    # TU-B_117
    def test_delegates_to_executor(self, repo, executor):
        executor.execute_one_raw.return_value = None
        repo.find_by_email("test@test.com")
        executor.execute_one_raw.assert_called_once()


# ---------------------------------------------------------------------------
# save
# ---------------------------------------------------------------------------


class TestSave:
    # TU-B_118
    def test_returns_true_on_success(self, repo, executor, valid_registration):
        executor.mutate_raw.return_value = True
        with patch(
            "src.auth.UserRepository.PasswordUtility.hash_password",
            return_value="hashed",
        ):
            assert repo.save(valid_registration) is True

    # TU-B_119
    def test_returns_false_on_failure(self, repo, executor, valid_registration):
        executor.mutate_raw.return_value = False
        with patch(
            "src.auth.UserRepository.PasswordUtility.hash_password",
            return_value="hashed",
        ):
            assert repo.save(valid_registration) is False

    # TU-B_120
    def test_delegates_to_executor(self, repo, executor, valid_registration):
        executor.mutate_raw.return_value = True
        with patch(
            "src.auth.UserRepository.PasswordUtility.hash_password",
            return_value="hashed",
        ):
            repo.save(valid_registration)
        executor.mutate_raw.assert_called_once()

    # TU-B_121
    def test_password_is_hashed(self, repo, executor, valid_registration):
        executor.mutate_raw.return_value = True
        with patch(
            "src.auth.UserRepository.PasswordUtility.hash_password",
            return_value="hashed",
        ) as mock_hash:
            repo.save(valid_registration)
            mock_hash.assert_called_once_with(valid_registration.password)

