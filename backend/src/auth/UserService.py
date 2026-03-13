from src.db import DbConnection
from sqlmodel import Session
from fastapi import Depends

from src.auth.schemas import User
from src.db.queryExecutor import QueryExecutor
from src.auth.CheckUserCmd import CheckUserCmd


class UserService:
    def __init__(self, db: Session = Depends(DbConnection.DbConnection)) -> None:
        self.db = db
        self.queryExecutor = QueryExecutor(db)

    def check_user(self, u: User) -> bool:
        res = self.queryExecutor.execute(CheckUserCmd(u))
        if res:
            return True
        else:
            return False
