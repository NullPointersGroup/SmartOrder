class User:
    """
    @brief Modello per il login
    @req RF-OB_24
    @req RF-OB_26
    """
    def __init__(self, username: str, password: str) -> None:
        self.username = username
        self.password = password


class UserRegistration:
    """
    @brief Modello per la registrazione
    @req RF-OB_02
    @req RF-OB_18
    @req RF-OB_08
    """
    def __init__(
        self,
        username: str,
        email: str,
        password: str,
        confirm_pwd: str,
    ) -> None:
        self.username    = username
        self.email       = email
        self.password    = password
        self.confirm_pwd = confirm_pwd
