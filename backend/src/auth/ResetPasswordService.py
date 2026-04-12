import bcrypt
from dataclasses import replace

from src.auth.UserRepoPort import UserRepoPort
from src.auth.models import UserReset
from src.auth.exceptions import (
    UserNotFoundError,
    InvalidCredentialsError,
    UserSamePasswordError,
    UserResetError,
)


class ResetPasswordService:
    """
    @brief Servizio applicativo: orchestra il caso d'uso di reset password
    """

    def __init__(self, port: UserRepoPort) -> None:
        self.port = port

    def reset_password(self, u: UserReset) -> None:
        """
        @brief Reimposta la password di un utente autenticato
        @param u: dati di reset (username, vecchia password, nuova password)
        """
        stored = self.port.find_by_username(u.username)

        if stored is None:
            raise UserNotFoundError()

        if not self._verify_password(u.password, stored.password):
            raise InvalidCredentialsError()

        if self._verify_password(u.new_pwd, stored.password):
            raise UserSamePasswordError()

        u_hashed = replace(u, new_pwd=self._hash_password(u.new_pwd))
        if not self.port.reset_password(u_hashed):
            raise UserResetError()

    def _verify_password(self, plain: str, hashed: str | None) -> bool:
        if hashed is None:
            return False
        return bcrypt.checkpw(plain.encode(), hashed.encode())

    def _hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
