from sqlalchemy.sql.dml import Insert
from src.auth.CreateUserCmd import CreateUserCmd
from src.auth.schemas import User


def test_execute_returns_insert_statement(mock_user: User):
    cmd = CreateUserCmd(mock_user)

    stmt = cmd.execute()

    assert isinstance(stmt, Insert)


def test_execute_insert_values(mock_user: User):
    cmd = CreateUserCmd(mock_user)

    stmt = cmd.execute()

    values = stmt.compile().params

    assert values["username"] == mock_user.username
    assert values["password"] == mock_user.password
    assert values["descrizione"] == "Cliente"
