from sqlmodel.sql.expression import SelectOfScalar
from src.auth.CheckUserCmd import CheckUserCmd
from src.auth.schemas import User


def test_check_user_cmd_returns_select(mock_user: User) -> None:
    cmd = CheckUserCmd(mock_user)
    result = cmd.execute()
    assert isinstance(result, SelectOfScalar)


def test_check_user_cmd_statement_has_correct_table(mock_user: User) -> None:
    cmd = CheckUserCmd(mock_user)
    result = cmd.execute()
    assert "utentiweb" in str(result)
