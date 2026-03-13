from src.db import DbConnection
from schemas import User
from sqlmodel import Session
from fastapi import Depends

from src.db.queryExecutor import QueryExecutor
from src.auth.CheckUserCmd import CheckUserCmd


class UserService:
    def init(self, db: Session = Depends(DbConnection.DbConnection)):
        self.db = db
        self.queryExecutor = QueryExecutor(db)

    def check_user(self, u: User) -> bool:
        res = self.queryExecutor.execute(CheckUserCmd(u))
        if res:
            return True
        else:
            return False
