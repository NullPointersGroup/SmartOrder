from pydantic import BaseModel
from .models import RoleEnum
from sqlmodel import Session
from fastapi import Depends
from typing import Annotated
from .database import get_session

SessionDep = Annotated[Session, Depends(get_session)]


class User(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    ok: bool
    errors: list[str]


class UserRegistration(User):
    email: str
    confirmPwd: str
