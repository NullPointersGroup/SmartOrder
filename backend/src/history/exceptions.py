class UserOrdersNotFoundException(Exception):
    def __init__(self, username: str) -> None:
        self.message = "Non è stato effettuato alcun ordine"
        super().__init__(self.message)
        
class OrdersNotFoundException(Exception):
    def __init__(self) -> None:
        self.message = "Non è stato effettuato alcun ordine"
        super().__init__(self.message)


class HistoryAccessDeniedException(Exception):
    def __init__(self) -> None:
        self.message = "Accesso non autorizzato allo storico ordini"
        super().__init__(self.message)


class OrderNotFoundException(Exception):
    def __init__(self, codice: str) -> None:
        self.message = f"Ordine '{codice}' non trovato"
        super().__init__(self.message)
