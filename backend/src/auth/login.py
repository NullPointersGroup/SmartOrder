from fastapi import APIRouter, Depends, status, HTTPException
from typing import Annotated, Sequence
from .schemas import AuthResponse, SessionDep, User

UserServiceDep=Annotated[UserService, Depends(UserService)]

router = APIRouter(prefix="/auth", tags=['auth']) 

@router.post('/login', response_model=AuthResponse)
def login(user: User, userService:UserServiceDep):
    if check_user():
    else:





