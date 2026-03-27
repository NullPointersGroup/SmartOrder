class ConversationNotFoundException(Exception):
    def __init__(self, conv_id: int) -> None:
        super().__init__(f"Conversazione {conv_id} non trovata")


class ToolNotFoundException(Exception):
    def __init__(self, tool_name: str) -> None:
        super().__init__(f"Tool '{tool_name}' non trovato nella lista dei tool registrati.")