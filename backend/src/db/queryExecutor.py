from typing import Generic, Sequence, TypeVar, Union

from sqlalchemy.sql.expression import Delete, Insert, Update
from sqlmodel import Session
from sqlmodel.sql.expression import SelectOfScalar
from sqlalchemy.exc import IntegrityError

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
        """
        @brief funzione che esegue solo ed eslusivamente oggetti che implementano l'interfaccia Query
        @param q: query che deve essere eseguita
        @return La sequenza di oggetti di tipo T che rispettano i vincoli della query
        """
        stmt = q.execute()
        return self.db.exec(stmt).all()

    def mutate(self, m: Mutation) -> bool:
        """
        @brief Funzione che esegue solo ed esclusivamente oggetti che implementano l'interfaccia Mutation, ovvero query che eseguono operazioni di inserimento, modifica e cancellazione
        @param m: query mutante (XD) che deve essere eseguita
        @return Se la modifica va a buon fine ritorna True, False altrimenti
        """
        try:
            self.db.exec(m.execute())
            self.db.commit()
            return True
        except IntegrityError:
            self.db.rollback()
            return False
        except Exception as e:
            self.db.rollback()
            print(f"Errore critico durante la mutazione: {e}")
            return False
