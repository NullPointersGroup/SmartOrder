from sqlalchemy.sql.dml import Insert
from src.auth.CreateUserCmd import CreateUserCmd
from src.auth.schemas import UserRegistration


def test_execute_returns_insert_statement(mock_user_registration: UserRegistration):
    cmd = CreateUserCmd(mock_user_registration)

    stmt = cmd.execute()

    assert isinstance(stmt, Insert)


def test_execute_insert_values(mock_user_registration: UserRegistration):
    cmd = CreateUserCmd(mock_user_registration)

    stmt = cmd.execute()

    values = stmt.compile().params

    assert values["username"] == mock_user_registration.username
    assert values["password"] == mock_user_registration.password
    assert values["descrizione"] == "Cliente"
