from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar
from src.chat.adapters.ChatMessageRepository import ChatMessageRepository
from src.db.queryExecutor import Query


class GetAllMessagesCmd(Query[ChatMessageRepository]):
    def __init__(self, id_conv: int) -> None:
        super().__init__()
        self.id_conv = id_conv

    def execute(self) -> SelectOfScalar[ChatMessageRepository]:
        """ "
        @brief Funzione che ritorna una query pronta per essere eseguita, in particolare controlla che l'ID della conversazione esista nel DB,
        """
        return select(ChatMessageRepository).where(
            ChatMessageRepository.id_conv == self.id_conv
        )
