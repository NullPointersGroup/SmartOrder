import os
from functools import lru_cache
from typing import Any, Generator

from sqlmodel import Session, create_engine
from sqlalchemy.engine import Engine

@lru_cache(maxsize=1)
def get_engine() -> Engine:
    """
    @brief Crea e restituisce il motore di connessione al database.
    @return Engine SQLAlchemy configurato con l'URL del database.
    @raises RuntimeError se la variabile d'ambiente DATABASE_URL non è impostata.
    """
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL non impostata")
    return create_engine(database_url, echo=True)


def get_conn() -> Generator[Session, Any, None]:
    """
    @brief Genera una sessione di database 
           per la dependency injection di FastAPI.
    @return Generator che produce una
            sessione SQLModel attiva.
    """
    with Session(get_engine()) as session:
        yield session