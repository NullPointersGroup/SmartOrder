from typing import Generic, Sequence, TypeVar, Union

from sqlalchemy.sql.expression import Delete, Insert, Update
from sqlmodel import Session
from sqlmodel.sql.expression import SelectOfScalar

# Ho usato un generic per avere un tipo di ritorno valido in Query/execute
T = TypeVar("T")

MutationStmt = Union[Delete, Insert, Update]


class Query(Generic[T]):
    def execute(self) -> SelectOfScalar[T]:
        raise NotImplementedError


# Interfaccia che rappresenta le operazioni di scrittura: INSERT, DELETE, UPDATE
class Mutation:
    def execute(self) -> MutationStmt:
        raise NotImplementedError


class QueryExecutor:
    def __init__(self, db: Session) -> None:
        self.db = db

    def execute(self, q: Query[T]) -> Sequence[T]:
        stmt = q.execute()
        return self.db.exec(stmt).all()

    def mutate(self, m: Mutation) -> None:
        self.db.exec(m.execute())
        self.db.commit()
