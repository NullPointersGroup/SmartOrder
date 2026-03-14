from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar
from src.auth.schemas import User
from src.db.models import Utente
from src.db.queryExecutor import Query


class CheckUserCmd(Query[Utente]):
    def __init__(self, u: User) -> None:
        super().__init__()
        self.user = u

    # def __hash_pwd(self, pwd: str) -> str:
    #     return ""

    def execute(self) -> SelectOfScalar[Utente]:
        return select(Utente).where(
            (
                Utente.username == self.user.username
                # Dovrebbe esserci anche la parte di hashing nel controllo
                # & (Utente.password == self.__hash_pwd(self, self.user.password))
            )
        )
