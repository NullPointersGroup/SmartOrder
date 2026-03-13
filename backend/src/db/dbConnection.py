import os
from typing import Any, Generator
from sqlmodel import create_engine, Session, select


class DbConnection:
    def __init__(self) -> None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise RuntimeError("DATABASE_URL non impostata")
        self.engine = create_engine(database_url, echo=True)

    def get_conn(self) -> Generator[Session, Any, None]:
        with Session(self.engine) as session:
            yield session

    def session(self) -> Session:
        return Session(self.engine)
