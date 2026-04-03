from dataclasses import dataclass

@dataclass
class User:
    username: str
    password: str
    admin: bool | None

@dataclass
class UserRegistration(User):
    email: str
    confirm_pwd: str

@dataclass
class UserReset(User):
    new_pwd: str