import dns.resolver
from sqlmodel import Session

from src.auth.IUserRepoPort import IUserRepoPort
from src.auth.UserRepository import UserRepository
from src.auth.models import User, UserRegistration
from src.auth.PasswordService import PasswordService


class UserRepoAdapter(IUserRepoPort):
    """
    @brief Adattatore secondario (driven adapter): implementa IUserRepoPort
           delegando la persistenza a UserRepository.
    """

    def __init__(self, db: Session) -> None:
        self.repo = UserRepository(db)

    def check_user(self, u: User) -> bool:
        """
        @brief Recupera l'utente per username e verifica la password
        @req RF-OB_24
        @req RF-OB_26
        """
        db_user = self.repo.find_by_username(u.username)

        if db_user is None or db_user.password is None:
            return False

        return PasswordService.verify_password(u.password, db_user.password)

    def username_exists(self, username: str) -> bool:
        """
        @brief Controlla se lo username è già nel DB
        @req RF-OB_03
        @req RF-OB_04
        """
        return self.repo.find_by_username(username) is not None

    def email_exists(self, email: str) -> bool:
        """
        @brief Controlla se l'email è già nel DB
        @req RF-OB_19
        @req RF-OB_21
        """
        return self.repo.find_by_email(email) is not None

    def email_domain_exists(self, email: str) -> bool:
        """
        @brief Verifica via DNS che il dominio abbia un MX record valido
        @req RF-OB_20
        """
        try:
            domain = email.split("@")[1]
            dns.resolver.resolve(domain, "MX", lifetime=3.0)
            return True
        except Exception:
            return False

    def add_user(self, u: UserRegistration) -> bool:
        """
        @brief Inserisce l'utente nel DB con password hashata
        @req RF-OB_02
        @req RF-OB_08
        @req RF-OB_18
        """
        return self.repo.save(u)
