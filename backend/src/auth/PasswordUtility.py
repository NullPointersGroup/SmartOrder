import os
import bcrypt

from passlib.context import CryptContext

SECRET_KEY: str = os.getenv("SECRET_KEY", "")
ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class PasswordUtility:
    @staticmethod
    def hash_password(password: str) -> str:
        """
        @brief Genera l'hash bcrypt della password
        @param password: la password in chiaro
        @return: l'hash della password
        """
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    @staticmethod
    def verify_password(plain: str, hashed: str | None) -> bool:
        """
        @brief Verifica che la password in chiaro corrisponda all'hash
        @param plain: la password in chiaro
        @param hashed: l'hash salvato nel database
        @return: True se la password è corretta, False altrimenti
        """
        if hashed is None:
            return False
        return bcrypt.checkpw(plain.encode(), hashed.encode())