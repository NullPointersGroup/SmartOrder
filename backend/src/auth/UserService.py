from fastapi import Depends
from sqlmodel import Session
from src.auth.CheckUserCmd import CheckUserCmd
from src.auth.schemas import User, UserRegistration
from src.db.queryExecutor import QueryExecutor

from ..db.dbConnection import get_conn
from .CreateUserCmd import CreateUserCmd


class UserService:
    def __init__(self, db: Session = Depends(get_conn)) -> None:
        self.db = db
        self.queryExecutor = QueryExecutor(db)

    def check_user(self, u: User) -> bool:
        """
        @brief Passa al QueryExecutor la query per il controllo di esistenza dell'utente
        @param u: utente da controllare
        @bug non controlla hashing password
        @return Se tutto va a buon fine la funzione ritorna True, altrimenti False
        """
        res = self.queryExecutor.execute(CheckUserCmd(u))
        if res:
            return True
        else:
            return False

    def create_user(self, u: UserRegistration) -> bool:
        """
        @brief Passa al QueryExecutor la query per la creazione dell'utente
        @param u: utente da creare
        @return Se la creazione va a buon fine, ritorna True
        @req RF-OB_02
        @req RF-OB_03
        @req RF-OB_08
        @req RF-OB_18
        @req RF-OB_19
        """
        return self.queryExecutor.mutate(CreateUserCmd(u))
