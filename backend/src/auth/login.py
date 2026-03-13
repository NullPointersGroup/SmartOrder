from fastapi import APIRouter, Depends
from typing import Annotated
from .schemas import AuthResponse, User
from UserService import UserService

UserServiceDep = Annotated[UserService, Depends(UserService)]

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
def login(user: User, userService: UserServiceDep):
    if userService.check_user(user):
        print("login succesful")
    else:
        print("login failed")
