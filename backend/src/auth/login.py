from fastapi import APIRouter, Depends
from typing import Annotated
from .schemas import AuthResponse, User
from src.auth.UserService import UserService

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
