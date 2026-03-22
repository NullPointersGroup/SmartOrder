from sqlmodel import Session, select

from src.catalog.adapters.CatalogProductRepository import CatalogProductRepository


class CatalogRepository:
    def __init__(self, db:Session) -> None:
        self.db = db

    # TODO Gestire caso prodotto inesistente (tipo di ritorno None) in Adapter/Service con HTTPException
    def get_product(self, prod_id: str) -> CatalogProductRepository | None:
        stmt = select(CatalogProductRepository).where(
                CatalogProductRepository.prod_id == prod_id
                )
        return self.db.exec(stmt).first()

    def get_full_catalog(self)->list[CatalogProductRepository]:
        stmt = select(CatalogProductRepository)
        return list(self.db.exec(stmt).all())

     

