import bcrypt
from dataclasses import replace

from src.auth.UserRepoPort import UserRepoPort
from src.auth.EmailValidationPort import EmailValidationPort
from src.auth.models import UserRegistration
from src.auth.exceptions import (
    UsernameAlreadyExistsError,
    InvalidEmailFormatError,
    EmailAlreadyExistsError,
    UserCreationError,
)


class RegisterUserService:
    """
    @brief Servizio applicativo: orchestra il caso d'uso di registrazione
    """

    def __init__(self, port: UserRepoPort, email_validator: EmailValidationPort) -> None:
        self.port = port
        self.email_validator = email_validator

    def register_user(self, u: UserRegistration) -> None:
        """
        @brief Orchestra la registrazione
        @param u: dati di registrazione
        @req RF-OB_16
        @req RF-OB_18
        """
        if self.port.find_by_username(u.username) is not None:
            raise UsernameAlreadyExistsError()

        if not self.email_validator.domain_exists(u.email):
            raise InvalidEmailFormatError()

        if self.port.email_exists(u.email):
            raise EmailAlreadyExistsError()

        u_hashed = replace(u, password=self._hash_password(u.password))
        if not self.port.add_user(u_hashed):
            raise UserCreationError()

    def _hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
