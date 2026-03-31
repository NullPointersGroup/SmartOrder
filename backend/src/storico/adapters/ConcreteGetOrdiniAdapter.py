from typing import List
from sqlmodel import Session
from src.storico.ports.StoricoRepoPort import StoricoRepoPort
from src.storico.adapters.StoricoRepository import StoricoRepository
from src.storico.StoricoModels import Ordine


class ConcreteGetOrdiniAdapter(StoricoRepoPort):

    def __init__(self, db: Session):
        self.repository = StoricoRepository(db)

    def get_ordini_by_username(self, username: str) -> List[Ordine]:
        return self.repository.get_ordini_by_username(username)

    def get_all_ordini(self) -> List[Ordine]:
        return self.repository.get_all_ordini()