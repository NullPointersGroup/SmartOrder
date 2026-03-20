from abc import ABC, abstractmethod

from src.auth.models import User, UserRegistration


class IUserRepoPort(ABC):
    """
    @brief Porta secondaria (driven port) del dominio verso la persistenza
    """

    @abstractmethod
    def check_user(self, u: User) -> bool:
       """
       @brief metodo astratto che serve a capire se uno user esiste
       """

    @abstractmethod
    def username_exists(self, username: str) -> bool:
        """
       @brief metodo astratto per capire se uno username esiste già
       """

    @abstractmethod
    def email_exists(self, email: str) -> bool:
        """
       @brief metodo astratto per capire se una mail esiste già
       """

    @abstractmethod
    def email_domain_exists(self, email: str) -> bool:
        """
       @brief metodo astratto per capire se il dominio della mail esiste oppure no
       """

    @abstractmethod
    def add_user(self, u: UserRegistration) -> bool:
        """
       @brief metodo astratto per aggiungere un utente
       """