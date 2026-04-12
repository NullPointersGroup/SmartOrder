from src.auth.UserRepoPort import UserRepoPort
from src.auth.exceptions import UserNotFoundError, UserDeletionError
from src.db.models import WebUser


class DeleteUserService:
    """
    @brief Servizio applicativo: orchestra i casi d'uso di cancellazione e recupero utente
    """

    def __init__(self, port: UserRepoPort) -> None:
        self.port = port

    def delete_user(self, username: str) -> None:
        """
        @brief Elimina un utente autenticato
        @param username: username dell'utente da eliminare
        """
        stored = self.port.find_by_username(username)

        if stored is None:
            raise UserNotFoundError()

        if not self.port.delete_user(username):
            raise UserDeletionError()

    def get_user(self, username: str) -> WebUser:
        """
        @brief Recupera i dati di un utente
        @param username: username dell'utente
        """
        user = self.port.find_by_username(username)
        if user is None:
            raise UserNotFoundError()
        return user
