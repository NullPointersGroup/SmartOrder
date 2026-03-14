from sqlalchemy.sql.expression import insert
from src.auth.schemas import User
from src.db.models import Utente

from ..db.queryExecutor import Mutation, MutationStmt


class CreateUserCmd(Mutation):
    def __init__(self, u: User) -> None:
        super().__init__()
        self.u = u

    def execute(self) -> MutationStmt:
        return insert(Utente).values(
            username=self.u.username, descrizione="Cliente", password=self.u.password
        )
