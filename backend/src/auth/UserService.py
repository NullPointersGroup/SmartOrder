from src.auth.models import User, UserRegistration
from src.auth.IUserRepository import IUserRepository
from src.auth.exceptions import (
    UsernameAlreadyExistsError,
    InvalidEmailFormatError,
    EmailAlreadyExistsError,
    UserCreationError,
)


class UserService:
    """
    @brief Servizio applicativo: orchestra i casi d'uso di autenticazione
    """

    def __init__(self, repo: IUserRepository) -> None:
        self.repo = repo

    def check_user(self, u: User) -> bool:
        """
        @brief Verifica le credenziali dell'utente per il login
        @param u: credenziali (username + password)
        @return True se le credenziali sono valide
        @req RF-OB_24, RF-OB_26
        """
        return self.repo.check_user(u)

    async def register_user(self, u: UserRegistration) -> bool:
        """
        @brief Orchestra la registrazione
        @param u: dati di registrazione
        @return True se la registrazione è avvenuta con successo
        @req RF-OB_02, RF-OB_03, RF-OB_05, RF-OB_08
        @req RF-OB_09, RF-OB_10, RF-OB_16, RF-OB_18
        @req RF-OB_19, RF-OB_20
        """
        if self.repo.username_exists(u.username):
            raise UsernameAlreadyExistsError()

        if not await self.repo.email_domain_exists(u.email):
            raise InvalidEmailFormatError()

        if self.repo.email_exists(u.email):
            raise EmailAlreadyExistsError()

        if not self.repo.add_user(u):
            raise UserCreationError()

        return True
