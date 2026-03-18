from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlmodel import Session
from src.auth.TokenService import TokenService
from src.auth.UserService import UserService
from src.auth.UserRepository import UserRepository
from src.auth.schemas import AuthResponse, UserSchema, UserRegistrationSchema
from src.auth.models import User, UserRegistration
from src.auth.exceptions import (
    UsernameAlreadyExistsError,
    InvalidEmailFormatError,
    EmailAlreadyExistsError,
    UserCreationError,
)
from src.db.dbConnection import get_conn

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginResponse(BaseModel):
    ok: bool
    errors: list[str]
    token: str | None = None


class ErrorResponse(BaseModel):
    errors: list[str]


def get_user_service(db: Session = Depends(get_conn)) -> UserService:
    return UserService(UserRepository(db))


UserServiceDep = Annotated[UserService, Depends(get_user_service)]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    username = TokenService.decode_token(token)
    if username is None:
        raise HTTPException(status_code=401, detail="Token non valido")
    return username


@router.post(
    "/login",
    responses={400: {"model": ErrorResponse, "description": "Username o password errati"}},
)
def login(payload: UserSchema, service: UserServiceDep) -> LoginResponse:
    """
    @brief Login utente
    @req RF-OB_24
    @req RF-OB_26
    @req RF-OB_28
    """
    u = User(username=payload.username, password=payload.password)

    if service.check_user(u):
        return LoginResponse(ok=True, errors=[], token=TokenService.create_token(payload.username))

    raise HTTPException(
        status_code=400,
        detail={"ok": False, "errors": ["Username o password errati"]},
    )


@router.post(
    "/register",
    status_code=201,
    responses={
        400: {"model": ErrorResponse, "description": "Errore validazione dati"},
        500: {"model": ErrorResponse, "description": "Errore durante la registrazione"},
    },
)
async def register(payload: UserRegistrationSchema, service: UserServiceDep) -> AuthResponse:
    """
    @brief Registrazione utente
    @req RF-OB_02
    @req RF-OB_03
    @req RF-OB_05
    @req RF-OB_08
    @req RF-OB_09
    @req RF-OB_10
    @req RF-OB_16
    @req RF-OB_18
    @req RF-OB_19
    @req RF-OB_20
    @req RF-OB_22
    """
    u = UserRegistration(
        username=payload.username,
        password=payload.password,
        confirm_pwd=payload.confirmPwd,
        email=payload.email,
    )

    try:
        await service.register_user(u)
        return AuthResponse(ok=True, errors=[])

    except UsernameAlreadyExistsError:
        raise HTTPException(
            status_code=400,
            detail={"ok": False, "errors": ["Username già esistente"]},
        )
    except InvalidEmailFormatError:
        raise HTTPException(
            status_code=400,
            detail={"ok": False, "errors": ["L'email non è nel formato corretto"]},
        )
    except EmailAlreadyExistsError:
        raise HTTPException(
            status_code=400,
            detail={"ok": False, "errors": ["Email già esistente"]},
        )
    except UserCreationError:
        raise HTTPException(
            status_code=500,
            detail={"ok": False, "errors": ["Errore durante la registrazione"]},
        )
