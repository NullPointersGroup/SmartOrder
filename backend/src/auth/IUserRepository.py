from abc import ABC, abstractmethod
from src.auth.models import User, UserRegistration


class IUserRepository(ABC):

    @abstractmethod
    def check_user(self, u: User) -> bool:
        """
        @req RF-OB_24, RF-OB_26
        """

    @abstractmethod
    def username_exists(self, username: str) -> bool:
        """
        @req RF-OB_03
        """

    @abstractmethod
    def email_exists(self, email: str) -> bool:
        """
        @req RF-OB_19
        """

    @abstractmethod
    async def email_domain_exists(self, email: str) -> bool:
        pass

    @abstractmethod
    def addUser(self, u: UserRegistration) -> bool:
        """
        @brief Inserisce utente nel DB con password hashata
        @req RF-OB_02, RF-OB_03, RF-OB_08, RF-OB_18, RF-OB_19
        """