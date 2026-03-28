from src.chat.ChatSchemas import Message, MessageRequest
from src.chat.LLMModels import LLMRequest, Message as LLMMessage
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
        if not self.repo.conversation_exist(conv_id):
            self.repo.create_conversation(username)
 
        user_message = self.repo.add_message(conv_id, content, SenderEnum.Utente)
 
        history = self.repo.get_messages(conv_id)
        llm_history = [
            LLMMessage(
                role="user" if m.sender == SenderEnum.Utente else "assistant",
                content=m.content,
            )
            for m in history
        ]
 
        request = LLMRequest(
            conversation_id=conv_id,
            message_id=user_message.id_message,
            chat_history=llm_history,
        )

        llm_response = self.llm.invoke(request)

        self.repo.add_message(conv_id, llm_response.content, SenderEnum.Chatbot)

        return user_message
