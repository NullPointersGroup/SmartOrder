from src.chat.ChatSchemas import Message
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
        self,
        conv_id: int,
        username: str,
        content: str,
        audio_file: None | str = None
    ) -> Message:
        # controlla se la conversazione esiste
        exists = self.repo.conversation_exist(conv_id)
        if not exists:
            conv = self.repo.create_conversation(username)
            conv_id = conv.id_conv

        # aggiunge il messaggio utente
        message: Message = self.repo.add_message(conv_id, content, SenderEnum.Utente)

        request = LLMRequest(
            conversation_id=conv_id,
            message_id=message.id_message or 0,
            chat_history=[LLMMessage(role="user", content=message.content)]
        )

        llm_response = self.llm.invoke_agent(request)

        # aggiunge risposta dell'LLM
        self.repo.add_message(conv_id, llm_response.content, SenderEnum.Chatbot)

        return message
