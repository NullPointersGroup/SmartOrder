import os
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext

SECRET_KEY: str = os.getenv("SECRET_KEY", "")
ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    @brief Genera l'hash bcrypt della password
    @param password str La password in chiaro
    @return str L'hash della password
    """
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """
    @brief Verifica che la password in chiaro corrisponda all'hash
    @param plain str La password in chiaro
    @param hashed str L'hash salvato nel database
    @return bool True se la password è corretta, False altrimenti
    """
    return pwd_context.verify(plain, hashed)


def create_token(username: str) -> str:
    """
    @brief Genera un JWT token firmato per l'utente
    @param username str Lo username dell'utente autenticato
    @return str Il token JWT
    """
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> str | None:
    """
    @brief Decodifica e verifica un JWT token
    @param token str Il token JWT da verificare
    @raise JWTError Se il token è invalido o scaduto
    @return str | None Lo username contenuto nel token, None se invalido
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None