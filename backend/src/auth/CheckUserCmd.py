from sqlalchemy import select
from src.db.queryExecutor import Query
from src.auth.schemas import User
from src.db.models import Utente


class CheckUserCmd(Query):
    def __init__(self, u: User) -> None:
        super().__init__()
        self.user = u

    def execute(self):
        return select(Utente).where(self.user.username == Utente.username)
