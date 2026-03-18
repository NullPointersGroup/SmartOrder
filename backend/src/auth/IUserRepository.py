from abc import ABC, abstractmethod

from src.auth.models import User, UserRegistration


class IUserRepository(ABC):
    """
    @brief Porta secondaria (driven port) del dominio verso la persistenza
    """

    @abstractmethod
    def check_user(self, u: User) -> bool:
        pass

    @abstractmethod
    def username_exists(self, username: str) -> bool:
        pass

    @abstractmethod
    def email_exists(self, email: str) -> bool:
        pass

    @abstractmethod
    async def email_domain_exists(self, email: str) -> bool:
        pass

    @abstractmethod
    def add_user(self, u: UserRegistration) -> bool:
        pass
