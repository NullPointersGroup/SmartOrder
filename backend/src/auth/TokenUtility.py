import os
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext

SECRET_KEY: str = os.getenv("SECRET_KEY", "")
ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class TokenUtility:
    @staticmethod
    def create_token(username: str) -> str:
        """
        @brief Genera un JWT token firmato per l'utente
        @param username: lo username dell'utente autenticato
        @return: il token JWT
        """
        exp_time = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS)
        payload = {
            "sub": username,
            "exp": int(exp_time.timestamp()), 
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> str | None:
        """
        @brief Decodifica e verifica un JWT token
        @param token: il token JWT da verificare
        @return: lo username contenuto nel token, None se invalido
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload.get("sub")
        except JWTError:
            return None