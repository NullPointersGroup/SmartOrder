from src.vec.VecDbService import VecDbService
from src.vec.ports.VecDbPortIn import VecDbPortIn


class VecDbAdapter(VecDbPortIn):
    def __init__(self, vec_db_service: VecDbService) -> None:
        self.vec_db_service = vec_db_service

    def get_catalog(self) -> None:
        self.vec_db_service.load_catalog()

    def get_cart(self, username: str) -> None:
        self.vec_db_service.load_cart(username)

    def search_catalog(self, query: str) -> list[str]:
        return self.vec_db_service.search_catalog(query)

    def search_cart(self, username: str, query: str) -> list[str]:
        return self.vec_db_service.search_cart(username, query)
