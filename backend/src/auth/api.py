from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlmodel import Session
from src.auth.TokenUtility import TokenUtility
from src.auth.UserService import UserService
from src.auth.UserRepoAdapter import UserRepoAdapter
from src.auth.schemas import AuthResponse, UserSchema, UserRegistrationSchema
from src.auth.models import User, UserRegistration
from src.auth.exceptions import (
    UsernameAlreadyExistsError,
    InvalidEmailFormatError,
    EmailAlreadyExistsError,
    UserCreationError,
    InvalidCredentialsError,
    UserNotFoundError,
    UserDeletionError
)
from src.db.dbConnection import get_conn
from src.auth.UserRepoAdapter import UserRepoAdapter
from src.auth.EmailValidationAdapter import EmailValidationAdapter

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginResponse(BaseModel):
    ok: bool
    errors: list[str]
    token: str | None = None


class ErrorResponse(BaseModel):
    errors: list[str]


def get_user_service(db: Session = Depends(get_conn)) -> UserService:
    return UserService(
        repo=UserRepoAdapter(db),
        email_validator=EmailValidationAdapter(),
    )


UserServiceDep = Annotated[UserService, Depends(get_user_service)]

def get_current_user(request: Request) -> str:
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Token mancante")

    username = TokenUtility.decode_token(token)

    if username is None:
        raise HTTPException(status_code=401, detail="Token non valido")

    return str(username)


@router.post(
    "/login",
    responses={400: {"model": ErrorResponse, "description": "Username o password errati"}},
)
def login(payload: UserSchema, service: UserServiceDep, response: Response) -> LoginResponse:
    u = User(username=payload.username, password=payload.password)

    try:
        username = service.check_user(u)
        token = TokenUtility.create_token(username)

        # set cookie compatibile localhost + cross-origin
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600,
            path="/",
        )

        return LoginResponse(ok=True, errors=[], token=None)

    except InvalidCredentialsError:
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
        service.register_user(u)
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
        
UserServiceCurrentUser = Annotated[str, Depends(get_current_user)]

@router.delete(
    "/account",
    status_code=200,
    responses={
        401: {"model": ErrorResponse, "description": "Token non valido"},
        404: {"model": ErrorResponse, "description": "Utente non trovato"},
        500: {"model": ErrorResponse, "description": "Errore durante la cancellazione"},
    },
)
def delete_account(
    service: UserServiceDep,
    current_user: UserServiceCurrentUser
) -> AuthResponse:
    """
    @brief Cancellazione account utente autenticato
    """
    try:
        service.delete_user(current_user)
        return AuthResponse(ok=True, errors=[])

    except UserNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"ok": False, "errors": ["Utente non trovato"]},
        )
    except UserDeletionError:
        raise HTTPException(
            status_code=500,
            detail={"ok": False, "errors": ["Errore durante la cancellazione"]},
        )
        
@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"ok": True}

@router.get("/me")
def me(current_user: UserServiceCurrentUser):
    return {"username": current_user}