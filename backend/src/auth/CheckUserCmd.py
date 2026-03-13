from typing import Tuple
from sqlalchemy import Select
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar
from src.db.queryExecutor import Query
from src.auth.schemas import User
from src.db.models import Utente


class CheckUserCmd(Query[Utente]):
    def __init__(self, u: User) -> None:
        super().__init__()
        self.user = u

    def execute(self) -> SelectOfScalar[Utente]:
        return select(Utente).where(self.user.username == Utente.username)
