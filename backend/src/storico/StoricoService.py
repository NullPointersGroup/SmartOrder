from typing import List
from src.storico.ports.StoricoRepoPort import StoricoRepoPort
from src.storico.StoricoSchemas import OrdineSchema, StoricoResponseSchema
from src.storico.exceptions import OrdiniNotFoundException


class StoricoService:

    def __init__(self, repo: StoricoRepoPort):
        self.repo = repo

    def get_ordini_cliente(self, username: str) -> StoricoResponseSchema:
        ordini_orm = self.repo.get_ordini_by_username(username)

        if not ordini_orm:
            raise OrdiniNotFoundException(username)

        ordini = [OrdineSchema.model_validate(o) for o in ordini_orm]
        return StoricoResponseSchema(ordini=ordini, totale_ordini=len(ordini))

    def get_ordini_admin(self) -> StoricoResponseSchema:
        ordini_orm = self.repo.get_all_ordini()
        ordini = [OrdineSchema.model_validate(o) for o in ordini_orm]
        return StoricoResponseSchema(ordini=ordini, totale_ordini=len(ordini))