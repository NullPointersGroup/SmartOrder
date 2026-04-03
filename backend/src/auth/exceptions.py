class UsernameAlreadyExistsError(ValueError):
    """
    @brief UC_01.1.2: Username già esistente
    @req RF-OB_03
    @req RF-OB_04
    """
    def __init__(self) -> None :
        super().__init__("Username già esistente")


class InvalidEmailFormatError(ValueError):
    """
    @brief UC_01.4.1: Email non valida (formato o dominio DNS)
    @req RF-OB_20
    """
    def __init__(self) -> None :
        super().__init__("L'email non è nel formato corretto")


class EmailAlreadyExistsError(ValueError):
    """
    @brief UC_01.4.2: Email già presente nel sistema
    @req RF-OB_19
    @req RF-OB_21
    """
    def __init__(self) -> None :
        super().__init__("Email già esistente")


class InvalidCredentialsError(ValueError):
    """
    @brief UC_03: Autenticazione non riuscita
    @req RF-OB_28
    """
    def __init__(self) -> None :
        super().__init__("Username o password errati")


class UserCreationError(Exception):
    """
    @brief Errore durante la creazione dell'utente
    """
    def __init__(self) -> None :
        super().__init__("Errore durante la registrazione")

class UserNotFoundError(ValueError):
    """
    @brief Utente non trovato nel sistema
    """
    def __init__(self) -> None:
        super().__init__("Utente non trovato")
        
class UserDeletionError(ValueError):
    """
    @brief Errore nella cancellazione dell'utente
    """
    def __init__(self) -> None:
        super().__init__("Errore nella cancellazione dell'utente")
        
class UserResetError(ValueError):
    """
    @brief Errore nella reimpostazione delle password dell'utente
    """
    def __init__(self) -> None:
        super().__init__("Errore nella cancellazione dell'utente")
        
class UserSamePasswordError(ValueError):
    """
    @brief Utilizzata la stessa password nella reimpostazione
    """
    def __init__(self) -> None:
        super().__init__("Non puoi utilizzare la stessa password iniziale")
    