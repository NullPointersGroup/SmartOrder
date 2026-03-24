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
        message = self.repo.add_message(conv_id, content, SenderEnum.User)
        llm_text = self.llm.invoke_agent(content)
        self.repo.add_message(conv_id, llm_text, SenderEnum.ChatBot)
        return message
