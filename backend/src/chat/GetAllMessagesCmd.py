from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar
from src.db.models import Messages
from src.db.queryExecutor import Query


class GetAllMessagesCmd(Query[Messages]):
    def __init__(self, id_conv: int) -> None:
        super().__init__()
        self.id_conv = id_conv

    def execute(self) -> SelectOfScalar[Messages]:
        """ "
        @brief Funzione che ritorna una query pronta per essere eseguita, in particolare controlla che l'ID della conversazione esista nel DB,
        """
        return select(Messages).where(
            Messages.id_conv == self.id_conv
        )
