from sqlmodel import Session, select, col
from sqlalchemy import insert, delete

from src.auth.models import UserRegistration, UserReset
from src.auth.PasswordUtility import PasswordUtility
from src.db.models import Utentiweb
from src.db.queryExecutor import QueryExecutor


class UserRepository:
    """
    @brief Repository che gestisce le operazioni di persistenza sugli utenti
           tramite QueryExecutor.
    """

    def __init__(self, db: Session) -> None:
        self.executor = QueryExecutor(db)

    def find_by_username(self, username: str) -> Utentiweb | None:
        """
        @brief Recupera un utente dal DB per username
        @return l'Utente se esiste
        """
        return self.executor.execute_one_raw(
            select(Utentiweb).where(Utentiweb.username == username)
        )

    def find_by_email(self, email: str) -> Utentiweb | None:
        """
        @brief Recupera un utente dal DB per email
        @return l'Utente se esiste
        """
        return self.executor.execute_one_raw(
            select(Utentiweb).where(Utentiweb.email == email)
        )

    def save(self, u: UserRegistration) -> bool:
        """
        @brief Inserisce un nuovo utente nel DB con password hashata
        @return restituisce true se l'operazione ha successo
        """
        return self.executor.mutate_raw(
            insert(Utentiweb).values(
                username=u.username,
                password=PasswordUtility.hash_password(u.password),
                email=u.email,
                admin=False
            )
        )
        
    def delete(self, username: str) -> bool:
        """
        @brief Elimina un utente dal DB per username
        @return Il risultato dell'operazione
        """
        return self.executor.mutate_raw(
            delete(Utentiweb).where(col(Utentiweb.username) == username)
        )
        
    def reset_password(self, u: UserReset) -> bool:
        """
        @brief Reimposta la password di un utente
        @return Il risultato dell'operazione
        """
        from sqlalchemy import update
        return self.executor.mutate_raw(
            update(Utentiweb)
            .where(col(Utentiweb.username) == u.username)
            .values(password=PasswordUtility.hash_password(u.new_pwd))
        )    
