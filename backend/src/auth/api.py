from typing import Annotated

from fastapi import APIRouter, Depends
from src.auth.UserService import UserService

from .schemas import AuthResponse, User

UserServiceDep = Annotated[UserService, Depends(UserService)]

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
def login(user: User, userService: UserServiceDep) -> AuthResponse:
    if userService.check_user(user):
        # AuthResponse può essere cambiata per tenere solo un messaggio, se facciamo come scritto nel commento sotto
        return AuthResponse(ok=True, errors=[])
    else:
        # Sarebbe più corretto avere un codice di errore HTTP piuttosto che un ok=false
        return AuthResponse(ok=False, errors=["Login failed"])


@router.post("/register", response_model=AuthResponse)
def create_user(user: User, userService: UserServiceDep) -> AuthResponse:
    if userService.create_user(user):
        return AuthResponse(ok=True, errors=[])
    else:
        return AuthResponse(ok=False, errors=["Creazione fallita"])
