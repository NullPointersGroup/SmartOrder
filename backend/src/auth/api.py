from typing import Annotated, Dict

from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, Request
from pydantic import BaseModel
from sqlmodel import Session
from src.auth.TokenUtility import TokenUtility
from src.auth.UserService import UserService
from src.auth.UserRepoAdapter import UserRepoAdapter
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
    UserSamePasswordError
)
from src.db.dbConnection import get_conn
from src.auth.UserRepoAdapter import UserRepoAdapter
from src.auth.EmailValidationAdapter import EmailValidationAdapter
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


def get_user_service(db: Session = Depends(get_conn)) -> UserService:
    """
    @brief Crea e restituisce un'istanza di UserService con le dipendenze necessarie
    @param db Sessione del database
    @return UserService configurato
    """
    return UserService(
        repo=UserRepoAdapter(db),
        email_validator=EmailValidationAdapter(),
    )


UserServiceDep = Annotated[UserService, Depends(get_user_service)]

def get_current_user(access_token: str | None = Cookie(default=None)) -> str:
    """
    @brief Estrae e valida il token JWT dal cookie access_token
    @param access_token Token JWT dal cookie
    @return Username decodificato dal token
    @throws HTTPException 401 se token assente o non valido
    """
    if access_token is None:
        raise HTTPException(status_code=401, detail="Non autenticato")
    username = TokenUtility.decode_token(access_token)
    if username is None:
        raise HTTPException(status_code=401, detail="Token non valido")
    return str(username)


@router.post(
    "/login",
    responses={
        400: {"model": ErrorResponse, "description": "Username o password errati"}
    },
)
@limiter.limit("10/minute")
def login(
    request: Request,
    payload: UserSchema,
    service: UserServiceDep,
    response: Response
) -> LoginResponse:
    """
    @brief Autentica un utente e imposta il cookie di sessione
    @param payload Credenziali utente (username, password)
    @param service Servizio utente iniettato
    @param response Oggetto Response per impostare il cookie
    @return LoginResponse con ok=True se successo
    @throws HTTPException 400 se credenziali errate
    """
    u = User(username=payload.username, password=payload.password, admin = None)

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

        return LoginResponse(ok=True, errors=[])

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
async def register(
    payload: UserRegistrationSchema, service: UserServiceDep
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
        admin = None,
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

@router.post(
    "/reset",
    status_code=200,
    responses={
        400: {"model": ErrorResponse, "description": "Stessa password"},
        401: {"model": ErrorResponse, "description": "Token non valido"},
        404: {"model": ErrorResponse, "description": "Utente non trovato"},
        500: {"model": ErrorResponse, "description": "Errore durante la reimpostazione"},
    }
)
def reset_password(
    body: ResetPasswordRequest,
    service: UserServiceDep,
    current_user: UserServiceCurrentUser,
) -> AuthResponse:
    """
    @brief Reimposta la password di un utente autenticato
    @param body Contiene old_password e new_password
    @param service Servizio utente iniettato
    @param current_user Username dell'utente autenticato
    @return AuthResponse con ok=True se reimpostazione riuscita
    @throws HTTPException 400, 401, 404, 500 in base all'errore
    """
    
    if is_password_common(body.new_password):
        raise HTTPException(
            status_code=400,
            detail={"ok": False, "errors": ["Password troppo comune, scegline una più sicura"]},
        )
    
    u = UserReset(
        username=current_user,
        password=body.old_password,
        admin = None,
        new_pwd=body.new_password,
    )
    try:
        service.check_user(u)
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
    service: UserServiceDep, current_user: UserServiceCurrentUser
) -> AuthResponse:
    """
    @brief Cancella l'account dell'utente autenticato
    @param service Servizio utente iniettato
    @param current_user Username dell'utente autenticato
    @return AuthResponse con ok=True se cancellazione riuscita
    @throws HTTPException 404 se utente non trovato, 500 per errori interni
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

@router.get(
    "/retrieve",
    responses={
        401: {"model": ErrorResponse, "description": "Non autenticato"},
        404: {"model": ErrorResponse, "description": "Utente non trovato"},
    },
)
def retrieve(
    service: UserServiceDep, current_user: UserServiceCurrentUser
) -> Dict[str, str | None]:
    """
    @brief Recupera i dati dell'utente autenticato
    @param service Servizio utente iniettato
    @param current_user Username dell'utente autenticato
    @return Dizionario con username e email dell'utente
    @throws HTTPException 404 se utente non trovato
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
    @param response Oggetto Response per eliminare il cookie
    @return Dizionario con ok=True
    """
    response.delete_cookie("access_token")
    return {"ok": True}

@router.get(
    "/me",
    responses={
        404: {"model": ErrorResponse, "description": "Utente non trovato"},
    },
)
def me(
    current_user: UserServiceCurrentUser,
    service: UserServiceDep
) -> dict[str, str | bool]:
    """
    @brief Restituisce username e ruolo admin dell'utente autenticato
    @param current_user Username dell'utente autenticato
    @param service Servizio utente iniettato
    @return Dizionario con username e admin
    @throws HTTPException 404 se utente non trovato
    """
    try:
        user = service.get_user(current_user)
        print(bool(user.admin))
        return {
            "username": user.username or "",
            "admin": bool(user.admin),
        }
    except UserNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"ok": False, "errors": [user_not_found]},
        )