from pydantic import BaseModel
from sqlmodel import Session
from fastapi import Depends
from typing import Annotated

from src.db.DbConnection import DbConnection

SessionDep = Annotated[Session, Depends(DbConnection)]


class User(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    ok: bool
    errors: list[str]


class UserRegistration(User):
    email: str
    confirmPwd: str
