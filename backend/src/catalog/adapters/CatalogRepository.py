from sqlmodel import Session, select

from src.db.models import Anaart


class CatalogRepository:
    def __init__(self, db:Session) -> None:
        self.db = db

    def get_product(self, prod_id: str) -> Anaart | None:
        stmt = select(Anaart).where(
                Anaart.prod_id == prod_id
                )
        return self.db.exec(stmt).first()

    def get_full_catalog(self)->list[Anaart]:
        stmt = select(Anaart)
        return list(self.db.exec(stmt).all())

     

