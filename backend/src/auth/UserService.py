from src.db import dbConnection
from sqlmodel import Session
from fastapi import Depends

from src.db.models import Utente
from src.db.queryExecutor import QueryExecutor
from src.auth.CheckUserCmd import CheckUserCmd


class UserService:
    def init(self, db: Session = Depends(dbConnection.get_db)):
        self.db = db
        self.queryExecutor = QueryExecutor(db)

    def check_user(self, u: User) -> bool:
        self.queryExecutor.execute(CheckUserCmd(u))
