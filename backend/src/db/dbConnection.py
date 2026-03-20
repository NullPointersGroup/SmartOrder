import os
from typing import Any, Generator

from sqlmodel import Session, create_engine

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL non impostata")
engine = create_engine(database_url, echo=True)


def get_conn() -> Generator[Session, Any, None]:
    with Session(engine) as session:
        yield session