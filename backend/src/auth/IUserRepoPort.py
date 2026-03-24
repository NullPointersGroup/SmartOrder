from abc import ABC, abstractmethod
from src.auth.models import User, UserRegistration
from src.db.models import Utente


class IUserRepoPort(ABC):
    """
    @brief Porta secondaria verso la persistenza utenti
    """

    @abstractmethod
    def find_by_username(self, username: str) -> Utente | None:
        """@brief Recupera un utente per username"""

    @abstractmethod
    def username_exists(self, username: str) -> bool:
        """@brief Controlla se lo username è già nel DB"""

    @abstractmethod
    def email_exists(self, email: str) -> bool:
        """@brief Controlla se l'email è già nel DB"""

    @abstractmethod
    def add_user(self, u: UserRegistration) -> bool:
        """@brief Inserisce un nuovo utente"""
        
    @abstractmethod
    def delete_user(self, username: str) -> bool:
        """@brief Elimina un utente dal DB"""