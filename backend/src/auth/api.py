from typing import Annotated

from fastapi import APIRouter, Depends
from src.auth.UserService import UserService

from .schemas import AuthResponse, User, UserRegistration

UserServiceDep = Annotated[UserService, Depends(UserService)]

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
def login(user: User, userService: UserServiceDep) -> AuthResponse:
    """
    @brief Endpoint per la login dell'utente
    @param user: L'utente che vuole effettuare il login
    @param userService: Dipendenza iniettata tramite FASTAPI, rappresenta una classe di servizio per le operazioni su db riguardanti gli utenti
    @bug  non controlla la password
    @return Ritorna una risposta che indica se l'utente effettivamente esiste
    @req RF-OB_24
    @req RF-OB_26
    """
    if userService.check_user(user):
        # AuthResponse può essere cambiata per tenere solo un messaggio, se facciamo come scritto nel commento sotto
        return AuthResponse(ok=True, errors=[])
    else:
        # Sarebbe più corretto avere un codice di errore HTTP piuttosto che un ok=false
        return AuthResponse(ok=False, errors=["Username o password errati"])


@router.post("/register", response_model=AuthResponse)
def create_user(user: UserRegistration, userService: UserServiceDep) -> AuthResponse:
    """
    @brief Endpoint per la registrazione dell'utente
    @param user: l'utente che vuole effettuare la registrazione
    @param userService: dipendenza iniettata tramite FASTAPI, rappresenta una classe di servizio per le operazioni su db riguardanti gli utenti
    @return Ritorna una risposta che indica se l'utente è stato registrato correttamente \n
    @req RF-OB_02
    @req RF-OB_3
    @req RF-OB_08
    @req RF-OB_18
    @req RF-OB_19
    """
    if userService.create_user(user):
        return AuthResponse(ok=True, errors=[])
    else:
        return AuthResponse(ok=False, errors=["Creazione fallita"])
