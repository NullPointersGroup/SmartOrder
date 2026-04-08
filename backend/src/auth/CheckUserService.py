import bcrypt

from src.auth.UserRepoPort import UserRepoPort
from src.auth.models import User
from src.auth.exceptions import InvalidCredentialsError


class CheckUserService:
    """
    @brief Servizio applicativo: orchestrates il caso d'uso di autenticazione
    """

    def __init__(self, port: UserRepoPort) -> None:
        self.port = port

    def check_user(self, u: User) -> str:
        """
        @brief Verifica le credenziali e ritorna lo username autenticato
        @param u: credenziali (username + password)
        @return username se le credenziali sono valide
        @req RF-OB_24
        @req RF-OB_26
        """
        stored = self.port.find_by_username(u.username)
        if stored is None or stored.username is None:
            raise InvalidCredentialsError()
        if not self._verify_password(u.password, stored.password):
            raise InvalidCredentialsError()
        return stored.username

    def _verify_password(self, plain: str, hashed: str | None) -> bool:
        if hashed is None:
            return False
        return bcrypt.checkpw(plain.encode(), hashed.encode())
