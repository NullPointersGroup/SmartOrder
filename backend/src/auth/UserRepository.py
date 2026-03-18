import dns.resolver
from sqlalchemy.sql.expression import insert
from sqlmodel import Session, select

from src.auth.models import User, UserRegistration
from src.auth.IUserRepository import IUserRepository
from src.auth.PasswordService import PasswordService
from src.db.models import Utente


class UserRepository(IUserRepository):
    """
    @brief Adattatore secondario (driven adapter): implementa IUserRepository
           usando SQLModel come ORM e dnspython per la verifica DNS.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    def check_user(self, u: User) -> bool:
        """
        @brief Recupera l'utente per username e verifica la password
        @req RF-OB_24, RF-OB_26
        """
        db_user: Utente | None = self.db.exec(
            select(Utente).where(Utente.username == u.username)
        ).first()

        if db_user is None or db_user.password is None:
            return False

        return PasswordService.verify_password(u.password, db_user.password)

    def username_exists(self, username: str) -> bool:
        """
        @brief Controlla se lo username è già nel DB
        @req RF-OB_03, RF-OB_04
        """
        return self.db.exec(
            select(Utente).where(Utente.username == username)
        ).first() is not None

    def email_exists(self, email: str) -> bool:
        """
        @brief Controlla se l'email è già nel DB
        @req RF-OB_19, RF-OB_21
        """
        return self.db.exec(
            select(Utente).where(Utente.email == email)
        ).first() is not None

    async def email_domain_exists(self, email: str) -> bool:
        """
        @brief Verifica via DNS che il dominio abbia un MX record valido
        @req RF-OB_20
        """
        try:
            domain = email.split("@")[1]
            dns.resolver.resolve(domain, "MX")
            return True
        except Exception:
            return False

    def add_user(self, u: UserRegistration) -> bool:
        """
        @brief Inserisce l'utente nel DB con password hashata
        @req RF-OB_02, RF-OB_08, RF-OB_18
        """
        try:
            self.db.exec(
                insert(Utente).values(
                    username=u.username,
                    descrizione="CLIENTE",
                    password=PasswordService.hash_password(u.password),
                    email=u.email,
                )
            )
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            return False
