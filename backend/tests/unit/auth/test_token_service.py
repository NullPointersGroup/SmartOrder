from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from jose import jwt

from src.auth.TokenService import TokenService

SECRET_KEY = "testsecret"
ALGORITHM  = "HS256"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_token(username: str, exp: datetime) -> str:
    return jwt.encode(
        {"sub": username, "exp": exp},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# ---------------------------------------------------------------------------
# create_token
# ---------------------------------------------------------------------------

class TestCreateToken:
    def test_returns_string(self):
        with patch("src.auth.TokenService.SECRET_KEY", SECRET_KEY):
            token = TokenService.create_token("testuser")
        assert isinstance(token, str)

    def test_token_contains_username(self):
        with patch("src.auth.TokenService.SECRET_KEY", SECRET_KEY):
            token = TokenService.create_token("testuser")
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "testuser"

    def test_token_has_expiry(self):
        with patch("src.auth.TokenService.SECRET_KEY", SECRET_KEY):
            token = TokenService.create_token("testuser")
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload

    def test_different_users_produce_different_tokens(self):
        with patch("src.auth.TokenService.SECRET_KEY", SECRET_KEY):
            t1 = TokenService.create_token("user1")
            t2 = TokenService.create_token("user2")
        assert t1 != t2


# ---------------------------------------------------------------------------
# decode_token
# ---------------------------------------------------------------------------

class TestDecodeToken:
    def test_valid_token_returns_username(self):
        exp = datetime.now(timezone.utc) + timedelta(hours=1)
        token = make_token("testuser", exp)
        with patch("src.auth.TokenService.SECRET_KEY", SECRET_KEY):
            result = TokenService.decode_token(token)
        assert result == "testuser"

    def test_expired_token_returns_none(self):
        exp = datetime.now(timezone.utc) - timedelta(hours=1)
        token = make_token("testuser", exp)
        with patch("src.auth.TokenService.SECRET_KEY", SECRET_KEY):
            result = TokenService.decode_token(token)
        assert result is None

    def test_invalid_token_returns_none(self):
        with patch("src.auth.TokenService.SECRET_KEY", SECRET_KEY):
            result = TokenService.decode_token("token.non.valido")
        assert result is None

    def test_empty_string_returns_none(self):
        with patch("src.auth.TokenService.SECRET_KEY", SECRET_KEY):
            result = TokenService.decode_token("")
        assert result is None

    def test_token_signed_with_wrong_key_returns_none(self):
        exp = datetime.now(timezone.utc) + timedelta(hours=1)
        token = jwt.encode({"sub": "testuser", "exp": exp}, "chiave_sbagliata", algorithm=ALGORITHM)
        with patch("src.auth.TokenService.SECRET_KEY", SECRET_KEY):
            result = TokenService.decode_token(token)
        assert result is None

    def test_roundtrip_create_and_decode(self):
        with patch("src.auth.TokenService.SECRET_KEY", SECRET_KEY):
            token  = TokenService.create_token("testuser")
            result = TokenService.decode_token(token)
        assert result == "testuser"