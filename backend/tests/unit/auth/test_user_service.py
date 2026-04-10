from unittest.mock import MagicMock
import pytest

from src.auth.DeleteUserService import DeleteUserService

@pytest.fixture
def delete_service(repo):
    return DeleteUserService(port=repo)

from src.auth.RegisterUserService import RegisterUserService

@pytest.fixture
def register_service(repo, email_validator):
    return RegisterUserService(port=repo, email_validator=email_validator)

from src.auth.ResetPasswordService import ResetPasswordService

@pytest.fixture
def reset_service(repo):
    return ResetPasswordService(port=repo)

from src.auth.CheckUserService import CheckUserService

@pytest.fixture
def check_service(repo):
    return CheckUserService(port=repo)

from src.auth.models import User, UserRegistration, UserReset
from src.auth.exceptions import (
    InvalidCredentialsError,
    UsernameAlreadyExistsError,
    InvalidEmailFormatError,
    EmailAlreadyExistsError,
    UserCreationError,
    UserNotFoundError,
    UserDeletionError,
    UserResetError,
    UserSamePasswordError,
)
from src.db.models import Utentiweb


@pytest.fixture
def repo():
    return MagicMock()


@pytest.fixture
def email_validator():
    return MagicMock()


@pytest.fixture
def valid_user():
    return User(username="testuser", password="Password1!", admin=None)


@pytest.fixture
def mock_utente():
    u = MagicMock(spec=Utentiweb)
    u.username = "testuser"
    u.password = "hashed_password"
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
        password="OldPassword1!",
        admin=False,
        new_pwd="NewPassword1!"
    )

class TestCheckUser:
    #TU-B_127
    def test_returns_username_with_valid_credentials(
        self, check_service, repo, valid_user, mock_utente
    ):
        repo.find_by_username.return_value = mock_utente
        with patch_verify(True):
            assert check_service.check_user(valid_user) == "testuser"

    #TU-B_128
    def test_raises_when_user_not_found(self, check_service, repo, valid_user):
        repo.find_by_username.return_value = None
        with pytest.raises(InvalidCredentialsError):
            check_service.check_user(valid_user)

    #TU-B_129
    def test_raises_when_password_wrong(
        self, check_service, repo, valid_user, mock_utente
    ):
        repo.find_by_username.return_value = mock_utente
        with patch_verify(False):
            with pytest.raises(InvalidCredentialsError):
                check_service.check_user(valid_user)
                
    #TU-B_130
    def test_raises_when_username_is_none(self, check_service, repo, valid_user, mock_utente):
        mock_utente.username = None
        repo.find_by_username.return_value = mock_utente

        with pytest.raises(InvalidCredentialsError):
            check_service.check_user(valid_user)


class TestRegisterUser:
    #TU-B_131
    def test_succeeds_with_valid_data(
        self, register_service, repo, email_validator, valid_registration
    ):
        repo.find_by_username.return_value = None
        repo.email_exists.return_value = False
        repo.add_user.return_value = True
        email_validator.domain_exists.return_value = True
        register_service.register_user(valid_registration)

    #TU-B_132
    def test_raises_when_username_exists(self, register_service, repo, valid_registration):
        repo.find_by_username.return_value = object()
        with pytest.raises(UsernameAlreadyExistsError):
            register_service.register_user(valid_registration)

    #TU-B_133
    def test_raises_when_email_domain_invalid(
        self, register_service, repo, email_validator, valid_registration
    ):
        repo.find_by_username.return_value = None
        email_validator.domain_exists.return_value = False
        with pytest.raises(InvalidEmailFormatError):
            register_service.register_user(valid_registration)

    #TU-B_134
    def test_raises_when_email_exists(
        self, register_service, repo, email_validator, valid_registration
    ):
        repo.find_by_username.return_value = None
        email_validator.domain_exists.return_value = True
        repo.email_exists.return_value = True
        with pytest.raises(EmailAlreadyExistsError):
            register_service.register_user(valid_registration)

    #TU-B_135
    def test_raises_when_add_user_fails(
        self, register_service, repo, email_validator, valid_registration
    ):
        repo.find_by_username.return_value = None
        email_validator.domain_exists.return_value = True
        repo.email_exists.return_value = False
        repo.add_user.return_value = False
        with pytest.raises(UserCreationError):
            register_service.register_user(valid_registration)
            
    #TU-B_136
    def test_password_is_hashed(self, register_service, repo, email_validator, valid_registration):
        repo.find_by_username.return_value = None
        repo.email_exists.return_value = False
        repo.add_user.return_value = True
        email_validator.domain_exists.return_value = True

        register_service.register_user(valid_registration)

        saved_user = repo.add_user.call_args[0][0]
        assert saved_user.password != valid_registration.password


class TestDeleteUser:
    #TU-B_137
    def test_succeeds_when_user_exists(self, delete_service, repo, mock_utente):
        repo.find_by_username.return_value = mock_utente
        repo.delete_user.return_value = True
        delete_service.delete_user("testuser")

    #TU-B_138
    def test_raises_when_user_not_found(self, delete_service, repo):
        repo.find_by_username.return_value = None
        with pytest.raises(UserNotFoundError):
            delete_service.delete_user("testuser")

    #TU-B_139
    def test_raises_when_delete_fails(self, delete_service, repo, mock_utente):
        repo.find_by_username.return_value = mock_utente
        repo.delete_user.return_value = False
        with pytest.raises(UserDeletionError):
            delete_service.delete_user("testuser")


from unittest.mock import patch

#TU-B_140
def patch_verify(return_value: bool):
    return patch(
        "src.auth.CheckUserService.CheckUserService._verify_password",
        return_value=return_value,
    )
    
#TU-B_141
def patch_verify_reset(return_value):
    return patch(
        "src.auth.ResetPasswordService.ResetPasswordService._verify_password",
        return_value=return_value,
    )

class TestGetUser:
    #TU-B_142
    def test_returns_user_when_exists(self, delete_service, repo, mock_utente):
        repo.find_by_username.return_value = mock_utente
        assert delete_service.get_user("testuser") == mock_utente

    #TU-B_143
    def test_raises_when_user_not_found(self, delete_service, repo):
        repo.find_by_username.return_value = None
        with pytest.raises(UserNotFoundError):
            delete_service.get_user("testuser")

class TestResetPassword:
    #TU-B_144
    def test_succeeds_with_valid_data(self, reset_service, repo, valid_reset, mock_utente):
        mock_utente.password = "hashed_old_password"
        repo.find_by_username.return_value = mock_utente
        repo.reset_password.return_value = True

        # Patch per forzare il comportamento corretto della verifica password
        def fake_verify(plain, hashed):
            if plain == valid_reset.password:
                return True  # vecchia password corretta
            if plain == valid_reset.new_pwd:
                return False  # nuova password diversa
            return False

        with patch.object(reset_service, "_verify_password", side_effect=fake_verify):
            reset_service.reset_password(valid_reset)

    #TU-B_145
    def test_raises_when_user_not_found(self, reset_service, repo, valid_reset):
        repo.find_by_username.return_value = None

        with pytest.raises(UserNotFoundError):
            reset_service.reset_password(valid_reset)

    #TU-B_146
    def test_raises_when_old_password_wrong(self, reset_service, repo, valid_reset, mock_utente):
        repo.find_by_username.return_value = mock_utente

        with patch_verify_reset(False):
            with pytest.raises(InvalidCredentialsError):
                reset_service.reset_password(valid_reset)

    #TU-B_147
    def test_raises_when_new_password_same(self, reset_service, repo, valid_reset, mock_utente):
        repo.find_by_username.return_value = mock_utente

        with patch(
            "src.auth.ResetPasswordService.ResetPasswordService._verify_password",
            side_effect=[True, True],
        ):
            with pytest.raises(UserSamePasswordError):
                reset_service.reset_password(valid_reset)

    #TU-B_148
    def test_raises_when_reset_fails(self, reset_service, repo, valid_reset, mock_utente):
        repo.find_by_username.return_value = mock_utente
        repo.reset_password.return_value = False

        with patch(
            "src.auth.ResetPasswordService.ResetPasswordService._verify_password",
            side_effect=[True, False],
        ):
            with pytest.raises(UserResetError):
                reset_service.reset_password(valid_reset)