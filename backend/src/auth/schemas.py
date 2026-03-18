from typing import Annotated
import re

from fastapi import Depends
from pydantic import BaseModel, field_validator, model_validator
from sqlmodel import Session

from ..db.dbConnection import get_conn

SessionDep = Annotated[Session, Depends(get_conn)]

PASSWORD_REGEX = re.compile(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,24}$'
)
EMAIL_REGEX = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

class UserSchema(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    ok: bool
    errors: list[str]
    token: str | None = None


class UserRegistrationSchema(UserSchema):
    email: str
    confirmPwd: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) > 24:
            raise ValueError("Lo username non può superare 24 caratteri")
        if not v.strip():
            raise ValueError("Lo username non può essere vuoto")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) > 24:
            raise ValueError("La password non può superare 24 caratteri")
        if not PASSWORD_REGEX.match(v):
            raise ValueError(
                "La password deve avere almeno 8 caratteri, "
                "1 maiuscola, 1 minuscola, 1 numero e 1 carattere speciale"
            )
        return v

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        if not EMAIL_REGEX.match(v):
            raise ValueError("L'email non è nel formato corretto")
        return v

    @model_validator(mode="after")
    def validate_confirm_password(self) -> "UserRegistrationSchema":
        if self.password != self.confirmPwd:
            raise ValueError("Le password non coincidono")
        return self
    

