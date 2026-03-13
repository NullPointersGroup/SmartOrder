from fastapi import APIRouter, Depends
from typing import Annotated
from .schemas import AuthResponse, User
from src.auth.UserService import UserService

UserServiceDep = Annotated[UserService, Depends(UserService)]

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
def login(user: User, userService: UserServiceDep) -> AuthResponse:
    if userService.check_user(user):
        return AuthResponse(ok=True, errors=[])
    else:
        return AuthResponse(ok=False, errors=["Login failed"])
