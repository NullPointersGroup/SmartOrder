from sqlmodel import Session, select
from sqlalchemy.sql.expression import insert

from src.auth.models import UserRegistration
from src.auth.PasswordService import PasswordService
from src.db.models import Utente
from src.db.queryExecutor import QueryExecutor


class UserRepository:
    """
    @brief Repository che gestisce le operazioni di persistenza sugli utenti
           tramite QueryExecutor.
    """

    def __init__(self, db: Session) -> None:
        self.executor = QueryExecutor(db)

    def find_by_username(self, username: str) -> Utente | None:
        """
        @brief Recupera un utente dal DB per username
        @return l'Utente se esiste
        """
        return self.executor.execute_one_raw(
            select(Utente).where(Utente.username == username)
        )

    def find_by_email(self, email: str) -> Utente | None:
        """
        @brief Recupera un utente dal DB per email
        @return l'Utente se esiste
        """
        return self.executor.execute_one_raw(
            select(Utente).where(Utente.email == email)
        )

    def save(self, u: UserRegistration) -> bool:
        """
        @brief Inserisce un nuovo utente nel DB con password hashata
        @return restituisce true se l'operazione ha successo
        """
        return self.executor.mutate_raw(
            insert(Utente).values(
                username=u.username,
                descrizione="CLIENTE",
                password=PasswordService.hash_password(u.password),
                email=u.email,
            )
        )
