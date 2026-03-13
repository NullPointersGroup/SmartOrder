from typing import Annotated

from fastapi import Depends
from pydantic import BaseModel
from sqlmodel import Session

from ..db.dbConnection import get_conn

SessionDep = Annotated[Session, Depends(get_conn)]


class User(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    ok: bool
    errors: list[str]


class UserRegistration(User):
    email: str
    confirmPwd: str
