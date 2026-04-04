import re

from pydantic import BaseModel, field_validator, model_validator

USERNAME_REGEX = re.compile(r"^\w{4,24}$")

PASSWORD_REGEX = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,24}$")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


class UserSchema(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    ok: bool
    errors: list[str]
    token: str | None = None
    
class ResetPasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UserRegistrationSchema(UserSchema):
    email: str
    confirmPwd: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """
        @brief valida lo username
        @raise ValueError
        @return lo username
        """
        if not USERNAME_REGEX.match(v):
            raise ValueError(
                "Lo username deve avere tra 4 e 24 caratteri e contenere solo lettere, cifre o underscore"
            )
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """
        @brief controlla se la password è valida
        @param v: la password da validare
        @raise ValueError
        @return ritorna la stessa password se validata
        """
        if not PASSWORD_REGEX.match(v):
            raise ValueError(
                "La password deve avere almeno 8 caratteri, "
                "1 maiuscola, 1 minuscola, 1 numero e 1 carattere speciale"
            )
        return v

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        """
        @brief valida il formato della email
        @raise ValueError
        @return la email se è corretta
        """
        if not EMAIL_REGEX.match(v):
            raise ValueError("L'email non è nel formato corretto")
        return v

    @model_validator(mode="after")
    def validate_confirm_password(self) -> "UserRegistrationSchema":
        """
        @brief controlla se la conferma della password è uguale alla password inserita
        @raise ValueErrori
        @return lo schema per registrare l'utente
        """
        if self.password != self.confirmPwd:
            raise ValueError("Le password non coincidono")
        return self


class LogoutResponse(BaseModel):
    username: str
