from src.chat.ports.LLMPort import LLMPort

class LLMAdapter(LLMPort):
    def __init__(self) -> None:
        super().__init__()

    def invoke_agent(self, prompt: str) -> str:
        return "Ecco la tua stringa: " + prompt
