from src.auth.models import User, UserRegistration
from src.auth.IUserRepoPort import IUserRepoPort
from src.auth.IEmailValidationPort import IEmailValidationPort
from src.auth.PasswordService import PasswordService
from src.auth.exceptions import (
    UsernameAlreadyExistsError,
    InvalidEmailFormatError,
    EmailAlreadyExistsError,
    UserCreationError,
    InvalidCredentialsError,
)


class UserService:
    """
    @brief Servizio applicativo: orchestra i casi d'uso di autenticazione
    """

    def __init__(
        self,
        repo: IUserRepoPort,
        email_validator: IEmailValidationPort,
    ) -> None:
        self.repo = repo
        self.email_validator = email_validator

    def check_user(self, u: User) -> str:
        """
        @brief Verifica le credenziali e ritorna lo username autenticato
        @param u: credenziali (username + password)
        @return username se le credenziali sono valide
        @req RF-OB_24
        @req RF-OB_26
        """
        stored = self.repo.find_by_username(u.username)

        if stored is None or stored.username is None:
            raise InvalidCredentialsError()

        if not PasswordService.verify_password(u.password, stored.password):
            raise InvalidCredentialsError()

        return stored.username

    def register_user(self, u: UserRegistration) -> None:
        """
        @brief Orchestra la registrazione
        @param u: dati di registrazione
        @req RF-OB_02
        @req RF-OB_03
        @req RF-OB_05
        @req RF-OB_08
        @req RF-OB_09
        @req RF-OB_10
        @req RF-OB_16
        @req RF-OB_18
        @req RF-OB_19
        @req RF-OB_20
        """
        if self.repo.username_exists(u.username):
            raise UsernameAlreadyExistsError()

        if not self.email_validator.domain_exists(u.email):
            raise InvalidEmailFormatError()

        if self.repo.email_exists(u.email):
            raise EmailAlreadyExistsError()

        if not self.repo.add_user(u):
            raise UserCreationError()