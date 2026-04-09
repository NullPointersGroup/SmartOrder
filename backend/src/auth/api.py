from typing import Annotated, Dict

from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, Request
from pydantic import BaseModel
from sqlmodel import Session

from src.auth.CheckUserService import CheckUserService
from src.auth.RegisterUserService import RegisterUserService
from src.auth.ResetPasswordService import ResetPasswordService
from src.auth.DeleteUserService import DeleteUserService
from src.auth.UserRepoAdapter import UserRepoAdapter
from src.auth.EmailValidationAdapter import EmailValidationAdapter
from src.auth.schemas import (
    AuthResponse,
    UserSchema,
    UserRegistrationSchema,
    ResetPasswordRequest,
)
from src.auth.models import User, UserRegistration, UserReset
from src.auth.exceptions import (
    UsernameAlreadyExistsError,
    InvalidEmailFormatError,
    EmailAlreadyExistsError,
    UserCreationError,
    InvalidCredentialsError,
    UserNotFoundError,
    UserDeletionError,
    UserResetError,
    UserSamePasswordError,
)
from src.db.dbConnection import get_conn
from src.auth.limiter import limiter
from src.auth.blocklist import is_password_common

router = APIRouter(prefix="/auth", tags=["auth"])

user_not_found: str = "Utente non trovato"


class LoginResponse(BaseModel):
    ok: bool
    errors: list[str]
    token: str | None = None


class ErrorResponse(BaseModel):
    errors: list[str]


# --- Dependency factories ---

def get_check_user_service(db: Session = Depends(get_conn)) -> CheckUserService:
    return CheckUserService(port=UserRepoAdapter(db))


def get_register_user_service(db: Session = Depends(get_conn)) -> RegisterUserService:
    return RegisterUserService(
        port=UserRepoAdapter(db),
        email_validator=EmailValidationAdapter(),
    )


def get_reset_password_service(db: Session = Depends(get_conn)) -> ResetPasswordService:
    return ResetPasswordService(port=UserRepoAdapter(db))


def get_delete_user_service(db: Session = Depends(get_conn)) -> DeleteUserService:
    return DeleteUserService(port=UserRepoAdapter(db))


# --- Annotated deps ---

CheckUserServiceDep = Annotated[CheckUserService, Depends(get_check_user_service)]
RegisterUserServiceDep = Annotated[RegisterUserService, Depends(get_register_user_service)]
ResetPasswordServiceDep = Annotated[ResetPasswordService, Depends(get_reset_password_service)]
DeleteUserServiceDep = Annotated[DeleteUserService, Depends(get_delete_user_service)]

import os
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext

SECRET_KEY: str = os.getenv("SECRET_KEY", "")
ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
def decode_token(token: str) -> str | None:
        """
        @brief Decodifica e verifica un JWT token
        @param token: il token JWT da verificare
        @return: lo username contenuto nel token, None se invalido
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload.get("sub")
        except JWTError:
            return None

def get_current_user(access_token: str | None = Cookie(default=None)) -> str:
    """
    @brief Estrae e valida il token JWT dal cookie access_token
    @param access_token Token JWT dal cookie
    @return Username decodificato dal token
    @throws HTTPException 401 se token assente o non valido
    """
    if access_token is None:
        raise HTTPException(status_code=401, detail="Non autenticato")
    username = decode_token(access_token)
    if username is None:
        raise HTTPException(status_code=401, detail="Token non valido")
    return str(username)


CurrentUserDep = Annotated[str, Depends(get_current_user)]


# --------------------------------------------
# ------------LoginController-----------------
# --------------------------------------------

def create_token(username: str) -> str:
        """
        @brief Genera un JWT token firmato per l'utente
        @param username: lo username dell'utente autenticato
        @return: il token JWT
        """
        exp_time = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS)
        payload = {
            "sub": username,
            "exp": int(exp_time.timestamp()), 
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

@router.post(
    "/login",
    responses={
        400: {"model": ErrorResponse, "description": "Username o password errati"},
    },
)
@limiter.limit("10/minute")
def login(
    request: Request,
    payload: UserSchema,
    service: CheckUserServiceDep,
    response: Response,
) -> LoginResponse:
    """
    @brief Autentica un utente e imposta il cookie di sessione
    @req RF-OB_24
    @req RF-OB_26
    """
    u = User(username=payload.username, password=payload.password, admin=None)

    try:
        username = service.check_user(u)
        token = create_token(username)

        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600,
            path="/",
        )

        return LoginResponse(ok=True, errors=[])

    except InvalidCredentialsError:
        raise HTTPException(
            status_code=400,
            detail={"ok": False, "errors": ["Username o password errati"]},
        )

# -----------------------------------------------
# ------------RegisterController-----------------
# -----------------------------------------------

@router.post(
    "/register",
    status_code=201,
    responses={
        400: {"model": ErrorResponse, "description": "Errore validazione dati"},
        500: {"model": ErrorResponse, "description": "Errore durante la registrazione"},
    },
)
async def register(
    payload: UserRegistrationSchema,
    service: RegisterUserServiceDep,
) -> AuthResponse:
    """
    @brief Registrazione utente
    @req RF-OB_03
    @req RF-OB_05
    @req RF-OB_09
    @req RF-OB_10
    @req RF-OB_16
    @req RF-OB_18
    @req RF-OB_19
    """
    if is_password_common(payload.password):
        raise HTTPException(
            status_code=400,
            detail={"ok": False, "errors": ["Password troppo comune, scegline una più sicura"]},
        )

    u = UserRegistration(
        username=payload.username,
        password=payload.password,
        admin=None,
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

# -----------------------------------------------
# ---------------ResetController-----------------
# -----------------------------------------------

@router.post(
    "/reset",
    status_code=200,
    responses={
        400: {"model": ErrorResponse, "description": "Stessa password"},
        401: {"model": ErrorResponse, "description": "Token non valido"},
        404: {"model": ErrorResponse, "description": "Utente non trovato"},
        500: {"model": ErrorResponse, "description": "Errore durante la reimpostazione"},
    },
)
def reset_password(
    body: ResetPasswordRequest,
    service: ResetPasswordServiceDep,
    current_user: CurrentUserDep,
) -> AuthResponse:
    """
    @brief Reimposta la password di un utente autenticato
    """
    if is_password_common(body.new_password):
        raise HTTPException(
            status_code=400,
            detail={"ok": False, "errors": ["Password troppo comune, scegline una più sicura"]},
        )

    u = UserReset(
        username=current_user,
        password=body.old_password,
        admin=None,
        new_pwd=body.new_password,
    )

    try:
        service.reset_password(u)
        return AuthResponse(ok=True, errors=[])

    except UserNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"ok": False, "errors": [user_not_found]},
        )
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=401,
            detail={"ok": False, "errors": ["Password attuale non corretta"]},
        )
    except UserSamePasswordError:
        raise HTTPException(
            status_code=400,
            detail={"ok": False, "errors": ["La nuova password deve essere diversa da quella attuale"]},
        )
    except UserResetError:
        raise HTTPException(
            status_code=500,
            detail={"ok": False, "errors": ["Errore durante la reimpostazione"]},
        )
        
# ---------------------------------------------
# ------------DeleteController-----------------
# ---------------------------------------------


@router.delete(
    "/delete",
    status_code=200,
    responses={
        401: {"model": ErrorResponse, "description": "Token non valido"},
        404: {"model": ErrorResponse, "description": "Utente non trovato"},
        500: {"model": ErrorResponse, "description": "Errore durante la cancellazione"},
    },
)
def delete_account(
    service: DeleteUserServiceDep,
    current_user: CurrentUserDep,
) -> AuthResponse:
    """
    @brief Cancella l'account dell'utente autenticato
    """
    try:
        service.delete_user(current_user)
        return AuthResponse(ok=True, errors=[])

    except UserNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"ok": False, "errors": [user_not_found]},
        )
    except UserDeletionError:
        raise HTTPException(
            status_code=500,
            detail={"ok": False, "errors": ["Errore durante la cancellazione"]},
        )

# ---------------------------------------------
# ------------GeneralController----------------
# ---------------------------------------------

@router.get(
    "/retrieve",
    responses={
        401: {"model": ErrorResponse, "description": "Non autenticato"},
        404: {"model": ErrorResponse, "description": "Utente non trovato"},
    },
)
def retrieve(
    service: DeleteUserServiceDep,
    current_user: CurrentUserDep,
) -> Dict[str, str | None]:
    """
    @brief Recupera i dati dell'utente autenticato
    """
    try:
        user = service.get_user(current_user)
        return {
            "username": user.username,
            "email": user.email,
        }
    except UserNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"ok": False, "errors": [user_not_found]},
        )


@router.post("/logout")
def logout(response: Response) -> dict[str, bool]:
    """
    @brief Effettua il logout eliminando il cookie access_token
    """
    response.delete_cookie("access_token")
    return {"ok": True}


@router.get(
    "/saveInStore",
    responses={
        404: {"model": ErrorResponse, "description": "Utente non trovato"},
    },
)
def save_in_store(
    current_user: CurrentUserDep,
    service: DeleteUserServiceDep,
) -> dict[str, str | bool]:
    """
    @brief Restituisce username e ruolo admin dell'utente autenticato
    """
    try:
        user = service.get_user(current_user)
        return {
            "username": user.username or "",
            "admin": bool(user.admin),
        }
    except UserNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"ok": False, "errors": [user_not_found]},
        )
