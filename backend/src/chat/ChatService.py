from src.chat.ChatSchemas import Message, MessageRequest
from src.enums import SenderEnum
from src.chat.ports.ChatRepoPort import ChatRepoPort
from src.chat.ports.LLMPort import LLMPort


class ChatService:
    def __init__(self, repo: ChatRepoPort, llm: LLMPort) -> None:
        self.repo = repo
        self.llm = llm

    def get_all_messages(self, conv_id: int) -> list[Message]:
        messages = self.repo.get_messages(conv_id)
        return messages

    def send_message(
        self, conv_id: int, username: str, content: str, audio_file: str | None
    ) -> Message:
        conv = self.repo.conversation_exist(conv_id)
        if not conv:
            self.repo.create_conversation(username)
        message = self.repo.add_message(conv_id, content, SenderEnum.Utente)
        llm_text = self.llm.invoke_agent(content)
        self.repo.add_message(conv_id, llm_text, SenderEnum.Chatbot)
        ## TODO decidere se ritorna il messaggio originale o la risposta del chatbot
        return message
