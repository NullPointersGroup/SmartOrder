from sqlmodel import Session

from src.auth.UserRepoPort import UserRepoPort
from src.auth.UserRepository import UserRepository
from src.auth.models import UserRegistration, UserReset
from src.db.models import WebUser


class UserRepoAdapter(UserRepoPort):
    """
    @brief Adapter verso la persistenza (DB)
    """

    def __init__(self, db: Session) -> None:
        self.repo = UserRepository(db)

    def find_by_username(self, username: str) -> WebUser | None:
        """
        @req RF-OB_24
        @req RF-OB_26
        """
        return self.repo.find_by_username(username)

    def email_exists(self, email: str) -> bool:
        """
        @brief controlla che la mail esiste
        """
        return self.repo.find_by_email(email) is not None

    def add_user(self, u: UserRegistration) -> bool:
        """
        @brief aggiunge l'utente
        """
        return self.repo.save(u)
    
    def delete_user(self, username: str) -> bool:
        return self.repo.delete(username)
    
    def reset_password(self, u: UserReset) -> bool:
        return self.repo.reset_password(u)
    
