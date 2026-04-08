import pytest
from pydantic import ValidationError

from src.auth.schemas import AuthResponse, UserRegistrationSchema, UserSchema

VALID_USERNAME = "testuser"
VALID_PASSWORD = "Password1!"
VALID_EMAIL = "test@test.com"


# ---------------------------------------------------------------------------
# UserSchema
# ---------------------------------------------------------------------------


class TestUserSchema:
    #TU-B_62
    def test_valid(self):
        u = UserSchema(username=VALID_USERNAME, password=VALID_PASSWORD)
        assert u.username == VALID_USERNAME
        assert u.password == VALID_PASSWORD

    #TU-B_63
    def test_missing_username(self):
        with pytest.raises(ValidationError):
            UserSchema(password=VALID_PASSWORD)

    #TU-B_64
    def test_missing_password(self):
        with pytest.raises(ValidationError):
            UserSchema(username=VALID_USERNAME)


# ---------------------------------------------------------------------------
# AuthResponse
# ---------------------------------------------------------------------------


class TestAuthResponse:
    #TU-B_65
    def test_ok_no_token(self):
        r = AuthResponse(ok=True, errors=[])
        assert r.token is None

    #TU-B_66
    def test_ok_with_token(self):
        r = AuthResponse(ok=True, errors=[], token="abc")
        assert r.token == "abc"

    #TU-B_67
    def test_not_ok_with_errors(self):
        r = AuthResponse(ok=False, errors=["errore"])
        assert r.ok is False
        assert "errore" in r.errors


# ---------------------------------------------------------------------------
# UserRegistrationSchema — username
# ---------------------------------------------------------------------------


class TestUsernameValidator:
    #TU-B_68
    def test_valid(self):
        u = UserRegistrationSchema(
            username=VALID_USERNAME,
            password=VALID_PASSWORD,
            email=VALID_EMAIL,
            confirmPwd=VALID_PASSWORD,
        )
        assert u.username == VALID_USERNAME

    #TU-B_69
    def test_too_short(self):
        with pytest.raises(ValidationError, match="username"):
            UserRegistrationSchema(
                username="ab",
                password=VALID_PASSWORD,
                email=VALID_EMAIL,
                confirmPwd=VALID_PASSWORD,
            )

    #TU-B_70
    def test_too_long(self):
        with pytest.raises(ValidationError, match="username"):
            UserRegistrationSchema(
                username="a" * 25,
                password=VALID_PASSWORD,
                email=VALID_EMAIL,
                confirmPwd=VALID_PASSWORD,
            )

    #TU-B_71
    def test_special_chars_not_allowed(self):
        with pytest.raises(ValidationError, match="username"):
            UserRegistrationSchema(
                username="test@user",
                password=VALID_PASSWORD,
                email=VALID_EMAIL,
                confirmPwd=VALID_PASSWORD,
            )

    #TU-B_72
    def test_exactly_4_chars(self):
        u = UserRegistrationSchema(
            username="abcd",
            password=VALID_PASSWORD,
            email=VALID_EMAIL,
            confirmPwd=VALID_PASSWORD,
        )
        assert u.username == "abcd"

    #TU-B_73
    def test_exactly_24_chars(self):
        u = UserRegistrationSchema(
            username="a" * 24,
            password=VALID_PASSWORD,
            email=VALID_EMAIL,
            confirmPwd=VALID_PASSWORD,
        )
        assert len(u.username) == 24


# ---------------------------------------------------------------------------
# UserRegistrationSchema — password
# ---------------------------------------------------------------------------


class TestPasswordValidator:
    #TU-B_74
    def test_valid(self):
        u = UserRegistrationSchema(
            username=VALID_USERNAME,
            password=VALID_PASSWORD,
            email=VALID_EMAIL,
            confirmPwd=VALID_PASSWORD,
        )
        assert u.password == VALID_PASSWORD

    #TU-B_75
    def test_too_short(self):
        with pytest.raises(ValidationError, match="password"):
            UserRegistrationSchema(
                username=VALID_USERNAME,
                password="Test1#!",
                email=VALID_EMAIL,
                confirmPwd="Ab1!",
            )  # NOSONAR

    #TU-B_76
    def test_too_long(self):
        with pytest.raises(ValidationError, match="password"):
            UserRegistrationSchema(
                username=VALID_USERNAME,
                password="Ab1!" + "a" * 21,
                email=VALID_EMAIL,
                confirmPwd="Ab1!" + "a" * 21,
            )

    #TU-B_77
    def test_missing_uppercase(self):
        with pytest.raises(ValidationError, match="password"):
            UserRegistrationSchema(
                username=VALID_USERNAME,
                password="password1!",
                email=VALID_EMAIL,
                confirmPwd="password1!",
            )

    #TU-B_78
    def test_missing_lowercase(self):
        with pytest.raises(ValidationError, match="password"):
            UserRegistrationSchema(
                username=VALID_USERNAME,
                password="PASSWORD1!",
                email=VALID_EMAIL,
                confirmPwd="PASSWORD1!",
            )

    #TU-B_79
    def test_missing_digit(self):
        with pytest.raises(ValidationError, match="password"):
            UserRegistrationSchema(
                username=VALID_USERNAME,
                password="Password!",
                email=VALID_EMAIL,
                confirmPwd="Password!",
            )

    #TU-B_80
    def test_missing_special_char(self):
        with pytest.raises(ValidationError, match="password"):
            UserRegistrationSchema(
                username=VALID_USERNAME,
                password="Password1",
                email=VALID_EMAIL,
                confirmPwd="Password1",
            )


# ---------------------------------------------------------------------------
# UserRegistrationSchema — email
# ---------------------------------------------------------------------------


class TestEmailValidator:
    #TU-B_81
    def test_valid(self):
        u = UserRegistrationSchema(
            username=VALID_USERNAME,
            password=VALID_PASSWORD,
            email=VALID_EMAIL,
            confirmPwd=VALID_PASSWORD,
        )
        assert u.email == VALID_EMAIL

    #TU-B_82
    def test_missing_at(self):
        with pytest.raises(ValidationError, match="email"):
            UserRegistrationSchema(
                username=VALID_USERNAME,
                password=VALID_PASSWORD,
                email="testtest.com",
                confirmPwd=VALID_PASSWORD,
            )

    #TU-B_83
    def test_missing_dot_in_domain(self):
        with pytest.raises(ValidationError, match="email"):
            UserRegistrationSchema(
                username=VALID_USERNAME,
                password=VALID_PASSWORD,
                email="test@testcom",
                confirmPwd=VALID_PASSWORD,
            )

    #TU-B_84
    def test_spaces_not_allowed(self):
        with pytest.raises(ValidationError, match="email"):
            UserRegistrationSchema(
                username=VALID_USERNAME,
                password=VALID_PASSWORD,
                email="te st@test.com",
                confirmPwd=VALID_PASSWORD,
            )


# ---------------------------------------------------------------------------
# UserRegistrationSchema — confirm password
# ---------------------------------------------------------------------------


class TestConfirmPasswordValidator:
    #TU-B_85
    def test_passwords_match(self):
        u = UserRegistrationSchema(
            username=VALID_USERNAME,
            password=VALID_PASSWORD,
            email=VALID_EMAIL,
            confirmPwd=VALID_PASSWORD,
        )
        assert u.confirmPwd == VALID_PASSWORD

    #TU-B_86
    def test_passwords_mismatch(self):
        with pytest.raises(ValidationError, match="coincidono"):
            UserRegistrationSchema(
                username=VALID_USERNAME,
                password=VALID_PASSWORD,
                email=VALID_EMAIL,
                confirmPwd="Different1!",
            )  # NOSONAR

