from backend.src.vec.VecDbService import VecDbService
from src.vec.adapters.CatalogVecDbAdapter import CatalogVecDbAdapter
from src.vec.adapters.CartVecDbAdapter import CartVecDbAdapter
from src.vec.ports.VecDbPortIn import VecDbPortIn


class VecDbAdapter(VecDbPortIn):
    def __init__(self, vec_db_service: VecDbService) -> None:
        self.vec_db_service = vec_db_service

    def get_catalog(self) -> list[int]:
        self.vec_db_service.load_catalog()

    def get_cart(self, username: str) -> list[int]:
        self.vec_db_service.load_cart(username)
