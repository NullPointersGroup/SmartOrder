from sqlalchemy.sql.expression import insert
from src.auth.schemas import UserRegistration
from src.db.models import Utente

from ..db.queryExecutor import Mutation, MutationStmt


class CreateUserCmd(Mutation):
    def __init__(self, u: UserRegistration) -> None:
        super().__init__()
        self.u = u

    def execute(self) -> MutationStmt:
        """
        @brief  Funzione che ritorna una query pronta per essere eseguita, in particolare una query di inserimento dell'Utente
        @bug  Da aggiungere la mail
        @return La query pronta per essere eseguita
        @req RF-OB_03
        @req RF-OB_19
        """
        return insert(Utente).values(
            username=self.u.username,
            descrizione="Cliente",
            password=self.u.password,
            email=self.u.email,
        )
