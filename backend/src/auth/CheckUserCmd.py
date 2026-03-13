from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar
from src.auth.schemas import User
from src.db.models import Utente
from src.db.queryExecutor import Query


class CheckUserCmd(Query[Utente]):
    def __init__(self, u: User) -> None:
        super().__init__()
        self.user = u

    def execute(self) -> SelectOfScalar[Utente]:
        return select(Utente).where(self.user.username == Utente.username)
