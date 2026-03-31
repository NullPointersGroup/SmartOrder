from typing import List
from sqlmodel import Session, select, col
from src.storico.StoricoModels import Ordine


class StoricoRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_ordini_by_username(self, username: str) -> List[Ordine]:
        statement = (
            select(Ordine)
            .where(Ordine.username == username)
            .order_by(col(Ordine.created_at).desc())
        )
        return list(self.db.exec(statement).all())

    def get_all_ordini(self) -> List[Ordine]:
        statement = select(Ordine).order_by(col(Ordine.created_at).desc())
        return list(self.db.exec(statement).all())