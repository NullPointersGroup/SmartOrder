from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from src.auth.models import User
from src.auth.authUtils import verify_password
from src.db.models import Utente
from src.db.queryExecutor import Query


class CheckUserCmd(Query[Utente]):
    def __init__(self, u: User) -> None:
        super().__init__()
        self.user = u

    def verify_password(self, plain: str, hashed: str) -> bool:
        """
        @brief Confronta la password in chiaro con l'hash nel DB
        @param plain: password inserita dall'utente
        @param hashed: hash bcrypt salvato nel DB
        @return True se la password è corretta
        @req RF-OB_26
        """
        return verify_password(plain, hashed)

    def execute(self) -> SelectOfScalar[Utente]:
        """
        @brief Recupera l'utente per username
        @req RF-OB_24
        """
        return select(Utente).where(Utente.username == self.user.username)
