class ConversationNotFoundException(Exception):
    def __init__(self, conv_id: int) -> None:
        super().__init__(f"Conversazione {conv_id} non trovata")
