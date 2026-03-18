class User:
    """
    @brief Modello per il login
    @req RF-OB_24 - username
    @req RF-OB_26 - password
    """
    def __init__(self, username: str, password: str) -> None:
        self.username = username
        self.password = password


class UserRegistration:
    """
    @brief Modello per la registrazione
    @req RF-OB_02 - username
    @req RF-OB_18 - email
    @req RF-OB_08 - password
    """
    def __init__(
        self,
        username: str,
        email: str,
        password: str,
        confirm_pwd: str
    ) -> None:
        self.username   = username
        self.email      = email
        self.password   = password
        self.confirm_pwd = confirm_pwd
        