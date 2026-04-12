from abc import ABC, abstractmethod


class EmailValidationPort(ABC):
    """
    @brief Porta secondaria verso la validazione del dominio email
    """

    @abstractmethod
    def domain_exists(self, email: str) -> bool:
        """@brief Verifica via DNS che il dominio abbia un MX record valido"""