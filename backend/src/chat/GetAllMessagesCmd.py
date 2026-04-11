from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar
from src.db.models import Messaggi
from src.db.queryExecutor import Query


class GetAllMessagesCmd(Query[Messaggi]):
    def __init__(self, id_conv: int) -> None:
        super().__init__()
        self.id_conv = id_conv

    def execute(self) -> SelectOfScalar[Messaggi]:
        """ "
        @brief Funzione che ritorna una query pronta per essere eseguita, in particolare controlla che l'ID della conversazione esista nel DB,
        """
        return select(Messaggi).where(
            Messaggi.id_conv == self.id_conv
        )
