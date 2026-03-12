import os
from typing import Any, Generator
from sqlmodel import create_engine, Session, select

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL non impostata")

engine = create_engine(DATABASE_URL, echo=True)


def get_db() -> Generator[Session, Any, None]:
    with Session(engine) as session:
        yield session
