from unittest.mock import patch

import pytest

from src.auth.PasswordUtility import PasswordUtility

PLAIN  = "Password1!"
HASHED = "$2b$12$fakehashvalue"


@pytest.fixture
def mock_bcrypt():
    with patch("src.auth.PasswordUtility.bcrypt") as b:
        b.hashpw.return_value  = HASHED.encode()
        b.gensalt.return_value = b"$2b$12$fakesalt"
        b.checkpw.return_value = True
        yield b


class TestHashPassword:
    def test_returns_string(self, mock_bcrypt):
        assert isinstance(PasswordUtility.hash_password(PLAIN), str)

    def test_hash_is_different_from_plain(self, mock_bcrypt):
        assert PasswordUtility.hash_password(PLAIN) != PLAIN

    def test_delegates_to_bcrypt(self, mock_bcrypt):
        PasswordUtility.hash_password(PLAIN)
        mock_bcrypt.hashpw.assert_called_once_with(PLAIN.encode(), mock_bcrypt.gensalt())


class TestVerifyPassword:
    def test_correct_password_returns_true(self, mock_bcrypt):
        mock_bcrypt.checkpw.return_value = True
        assert PasswordUtility.verify_password(PLAIN, HASHED) is True

    def test_wrong_password_returns_false(self, mock_bcrypt):
        mock_bcrypt.checkpw.return_value = False
        assert PasswordUtility.verify_password("WrongPass1!", HASHED) is False

    def test_none_hash_returns_false_without_calling_bcrypt(self, mock_bcrypt):
        assert PasswordUtility.verify_password(PLAIN, None) is False
        mock_bcrypt.checkpw.assert_not_called()

    def test_empty_password_delegates_to_bcrypt(self, mock_bcrypt):
        mock_bcrypt.checkpw.return_value = False
        assert PasswordUtility.verify_password("", HASHED) is False
        mock_bcrypt.checkpw.assert_called_once_with("".encode(), HASHED.encode())