from fastapi import Depends
from sqlmodel import Session
from src.auth.CheckUserCmd import CheckUserCmd
from src.auth.schemas import User
from src.db.queryExecutor import QueryExecutor

from ..db.dbConnection import get_conn


class UserService:
    def __init__(self, db: Session = Depends(get_conn)) -> None:
        self.db = db
        self.queryExecutor = QueryExecutor(db)

    def check_user(self, u: User) -> bool:
        res = self.queryExecutor.execute(CheckUserCmd(u))
        if res:
            return True
        else:
            return False
