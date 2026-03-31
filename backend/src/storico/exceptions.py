class OrdiniNotFoundException(Exception):
    def __init__(self, username: str) -> None:
        self.message = f"Nessun ordine trovato per l'utente '{username}'"
        super().__init__(self.message)


class StoricoAccessDeniedException(Exception):
    def __init__(self) -> None:
        self.message = "Accesso non autorizzato allo storico ordini"
        super().__init__(self.message)