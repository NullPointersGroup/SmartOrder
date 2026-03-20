from typing import Annotated

from fastapi import APIRouter, Depends
from src.auth.UserService import UserService

from .schemas import AuthResponse, User, UserRegistration

UserServiceDep = Annotated[UserService, Depends(UserService)]
