from sqlmodel import Session
from sqlmodel.sql.expression import select
from src.auth.schemas import User, UserRegistration
from src.auth.UserService import UserService
from src.db.models import Utente


def test_check_user_succesful(mock_user: User, db_session: Session):
    utente_esistente = Utente(
        username=mock_user.username, password=mock_user.password, email="test@test", descrizione="test"
    )

    db_session.add(utente_esistente)
    db_session.commit()

    service = UserService(db=db_session)

    result = service.check_user(mock_user)

    assert result is True, (
        "Il servizio dovrebbe trovare l'utente che abbiamo appena inserito"
    )


def test_check_user_fail(mock_user: User, db_session: Session):
    service = UserService(db=db_session)
    assert service.check_user(mock_user) is False, "L'utente non dovrebbe esistere"


def test_check_create_user_succesful(mock_user_registration: UserRegistration, db_session: Session):
    service = UserService(db=db_session)
    user = UserRegistration(username=mock_user_registration.username, password=mock_user_registration.password, email=mock_user_registration.email, confirmPwd=mock_user_registration.confirmPwd)

    result = service.create_user(user)

    assert result is True

    statement = select(Utente).where(Utente.username == mock_user_registration.username)
    user_in_db = db_session.exec(statement).first()

    assert user_in_db is not None, "L'utente dovrebbe essere presente nel database"
    assert user_in_db.username == mock_user_registration.username


def test_check_create_user_fail(mock_user_registration: UserRegistration, db_session: Session):
    utente_esistente = Utente(
        username=mock_user_registration.username, password=mock_user_registration.password, email=mock_user_registration.email, descrizione="test"
    )

    db_session.add(utente_esistente)
    db_session.commit()

    service = UserService(db=db_session)
    assert service.create_user(mock_user_registration) is False, "Non dovrebbe creare l'utente"
