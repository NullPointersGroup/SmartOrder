from sqlalchemy.sql.expression import insert

from src.auth.models import UserRegistration
from src.auth.authUtils import hash_password
from src.db.models import Utente
from src.db.queryExecutor import Mutation, MutationStmt


class CreateUserCmd(Mutation):
    def __init__(self, u: UserRegistration) -> None:
        super().__init__()
        self.u = u

    def execute(self) -> MutationStmt:
        """
        @brief INSERT dell'utente con password hashata tramite authUtils
        @return La query pronta per essere eseguita
        @req RF-OB_02 - username
        @req RF-OB_08 - password
        @req RF-OB_18 - email
        """
        return insert(Utente).values(
            username=self.u.username,
            descrizione="CLIENTE",
            password=hash_password(self.u.password),
            email=self.u.email,
        )
