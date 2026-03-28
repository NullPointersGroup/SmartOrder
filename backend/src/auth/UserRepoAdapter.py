from sqlmodel import Session

from src.auth.IUserRepoPort import IUserRepoPort
from src.auth.UserRepository import UserRepository
from src.auth.models import UserRegistration, UserReset
from src.db.models import Utente


class UserRepoAdapter(IUserRepoPort):
    """
    @brief Adapter verso la persistenza (DB)
    """

    def __init__(self, db: Session) -> None:
        self.repo = UserRepository(db)

    def find_by_username(self, username: str) -> Utente | None:
        """
        @req RF-OB_24
        @req RF-OB_26
        """
        return self.repo.find_by_username(username)

    def username_exists(self, username: str) -> bool:
        """
        @req RF-OB_03
        @req RF-OB_04
        """
        return self.repo.find_by_username(username) is not None

    def email_exists(self, email: str) -> bool:
        """
        @req RF-OB_19
        @req RF-OB_21
        """
        return self.repo.find_by_email(email) is not None

    def add_user(self, u: UserRegistration) -> bool:
        """
        @req RF-OB_02
        @req RF-OB_08
        @req RF-OB_18
        """
        return self.repo.save(u)
    
    def delete_user(self, username: str) -> bool:
        return self.repo.delete(username)
    
    def reset_password(self, u: UserReset) -> bool:
        return self.repo.reset_password(u)
    