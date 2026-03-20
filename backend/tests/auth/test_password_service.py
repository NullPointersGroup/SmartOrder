from unittest.mock import MagicMock, patch

import pytest

from src.auth.PasswordService import PasswordService

PLAIN  = "Password1!"
HASHED = "$2b$12$fakehashvalue"


@pytest.fixture
def mock_pwd_context():
    with patch("src.auth.PasswordService.pwd_context") as ctx:
        ctx.hash.return_value   = HASHED
        ctx.verify.return_value = True
        yield ctx


class TestHashPassword:
    def test_returns_string(self, mock_pwd_context):
        assert isinstance(PasswordService.hash_password(PLAIN), str)

    def test_hash_is_different_from_plain(self, mock_pwd_context):
        assert PasswordService.hash_password(PLAIN) != PLAIN

    def test_delegates_to_pwd_context(self, mock_pwd_context):
        PasswordService.hash_password(PLAIN)
        mock_pwd_context.hash.assert_called_once_with(PLAIN)


class TestVerifyPassword:
    def test_correct_password_returns_true(self, mock_pwd_context):
        mock_pwd_context.verify.return_value = True
        assert PasswordService.verify_password(PLAIN, HASHED) is True

    def test_wrong_password_returns_false(self, mock_pwd_context):
        mock_pwd_context.verify.return_value = False
        assert PasswordService.verify_password("WrongPass1!", HASHED) is False

    def test_none_hash_returns_false_without_calling_context(self, mock_pwd_context):
        # il None viene gestito prima di arrivare a pwd_context
        assert PasswordService.verify_password(PLAIN, None) is False
        mock_pwd_context.verify.assert_not_called()

    def test_empty_password_delegates_to_pwd_context(self, mock_pwd_context):
        mock_pwd_context.verify.return_value = False
        assert PasswordService.verify_password("", HASHED) is False
        mock_pwd_context.verify.assert_called_once_with("", HASHED)