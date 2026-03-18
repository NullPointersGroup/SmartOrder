import dns.resolver
from sqlmodel import Session, select

from src.auth.models import User, UserRegistration
from src.auth.ports import IUserRepository
from src.auth.CheckUserCmd import CheckUserCmd
from src.auth.CreateUserCmd import CreateUserCmd
from src.db.models import Utente
from src.db.queryExecutor import QueryExecutor


class UserRepository(IUserRepository):
    def __init__(self, db: Session) -> None:
        self.db = db
        self.queryExecutor = QueryExecutor(db)

    def check_user(self, u: User) -> bool:
        """
        @brief Recupera utente per username e verifica la password
        @req RF-OB_24, RF-OB_26
        """
        cmd = CheckUserCmd(u)
        db_user: Utente | None = self.queryExecutor.execute_one(cmd)
        if db_user is None or db_user.password is None:
            return False
        return cmd.verify_password(u.password, db_user.password)

    def username_exists(self, username: str) -> bool:
        """
        @brief Controlla se lo username è già nel DB
        @req RF-OB_03, RF-OB_04
        """
        result = self.db.exec(
            select(Utente).where(Utente.username == username)
        ).first()
        return result is not None

    def email_exists(self, email: str) -> bool:
        """
        @brief Controlla se l'email è già nel DB
        @req RF-OB_19, RF-OB_21
        """
        result = self.db.exec(
            select(Utente).where(Utente.email == email)
        ).first()
        return result is not None

    def email_domain_exists(self, email: str) -> bool:
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

    def addUser(self, u: UserRegistration) -> bool:
        """
        @brief Inserisce l'utente nel DB tramite CreateUserCmd
        @req RF-OB_02, RF-OB_08, RF-OB_18
        """
        return self.queryExecutor.mutate(CreateUserCmd(u))