from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from jose import jwt

from src.auth.TokenUtility import TokenUtility

SECRET_KEY = "testsecret"
ALGORITHM = "HS256"


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
    # TU-B_87
    def test_returns_string(self):
        with patch("src.auth.TokenUtility.SECRET_KEY", SECRET_KEY):
            token = TokenUtility.create_token("testuser")
        assert isinstance(token, str)

    # TU-B_88
    def test_token_contains_username(self):
        with patch("src.auth.TokenUtility.SECRET_KEY", SECRET_KEY):
            token = TokenUtility.create_token("testuser")
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "testuser"

    # TU-B_89
    def test_token_has_expiry(self):
        with patch("src.auth.TokenUtility.SECRET_KEY", SECRET_KEY):
            token = TokenUtility.create_token("testuser")
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload

    # TU-B_90
    def test_different_users_produce_different_tokens(self):
        with patch("src.auth.TokenUtility.SECRET_KEY", SECRET_KEY):
            t1 = TokenUtility.create_token("user1")
            t2 = TokenUtility.create_token("user2")
        assert t1 != t2


# ---------------------------------------------------------------------------
# decode_token
# ---------------------------------------------------------------------------


class TestDecodeToken:
    # TU-B_91
    def test_valid_token_returns_username(self):
        exp = datetime.now(timezone.utc) + timedelta(hours=1)
        token = make_token("testuser", exp)
        with patch("src.auth.TokenUtility.SECRET_KEY", SECRET_KEY):
            result = TokenUtility.decode_token(token)
        assert result == "testuser"

    # TU-B_92
    def test_expired_token_returns_none(self):
        exp = datetime.now(timezone.utc) - timedelta(hours=1)
        token = make_token("testuser", exp)
        with patch("src.auth.TokenUtility.SECRET_KEY", SECRET_KEY):
            result = TokenUtility.decode_token(token)
        assert result is None

    # TU-B_93
    def test_invalid_token_returns_none(self):
        with patch("src.auth.TokenUtility.SECRET_KEY", SECRET_KEY):
            result = TokenUtility.decode_token("token.non.valido")
        assert result is None

    # TU-B_94
    def test_empty_string_returns_none(self):
        with patch("src.auth.TokenUtility.SECRET_KEY", SECRET_KEY):
            result = TokenUtility.decode_token("")
        assert result is None

    # TU-B_95
    def test_token_signed_with_wrong_key_returns_none(self):
        exp = datetime.now(timezone.utc) + timedelta(hours=1)
        token = jwt.encode(
            {"sub": "testuser", "exp": exp}, "chiave_sbagliata", algorithm=ALGORITHM
        )
        with patch("src.auth.TokenUtility.SECRET_KEY", SECRET_KEY):
            result = TokenUtility.decode_token(token)
        assert result is None

    # TU-B_96
    def test_roundtrip_create_and_decode(self):
        with patch("src.auth.TokenUtility.SECRET_KEY", SECRET_KEY):
            token = TokenUtility.create_token("testuser")
            result = TokenUtility.decode_token(token)
        assert result == "testuser"

