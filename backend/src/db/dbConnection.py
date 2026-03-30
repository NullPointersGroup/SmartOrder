import os
from functools import lru_cache
from typing import Any, Generator

from sqlmodel import Session, create_engine
from sqlalchemy.engine import Engine

@lru_cache(maxsize=1)
def get_engine() -> Engine:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL non impostata")
    return create_engine(database_url, echo=True)


def get_conn() -> Generator[Session, Any, None]:
    with Session(get_engine()) as session:
        yield session
