from typing import Generic, Tuple, TypeVar, Sequence
from sqlalchemy import Select
from sqlmodel import Session
from sqlmodel.sql.expression import SelectOfScalar

# Ho usato un generic per avere un tipo di ritorno valido in Query/execute
T = TypeVar("T")


class Query(Generic[T]):
    def execute(self) -> SelectOfScalar[T]:
        raise NotImplementedError


class QueryExecutor:
    def __init__(self, db: Session) -> None:
        self.db = db

    def execute(self, q: Query[T]) -> Sequence[T]:
        stmt = q.execute()
        return self.db.exec(stmt).all()
