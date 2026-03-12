from sqlmodel import Session


class Query:
    def execute(self):
        pass


class QueryExecutor:
    def __init__(self, db: Session) -> None:
        self.db = db

    def execute(self, q: Query):
        return self.db.exec(q.execute()).all()
