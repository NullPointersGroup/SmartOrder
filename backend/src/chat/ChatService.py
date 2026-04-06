from src.chat.ChatSchemas import Message
from src.chat.LLMModels import LLMRequest, UserPreference
from src.chat.LLMModels import Message as LLMMessage
from src.chat.ports.ChatRepoPort import ChatRepoPort
from src.chat.ports.LLMPort import LLMPort
from src.storico.StoricoService import StoricoService
from src.enums import SenderEnum


class ChatService:
    def __init__(
        self,
        repo: ChatRepoPort,
        llm: LLMPort,
        storico_service: StoricoService | None = None,
    ) -> None:
        self.repo = repo
        self.llm = llm
        self.storico_service = storico_service

    def get_all_messages(self, conv_id: int) -> list[Message]:
        messages = self.repo.get_messages(conv_id)
        return messages

    def send_message(
        self,
        conv_id: int,
        username: str,
        content: str,
    ) -> Message:
        # controlla se la conversazione esiste
        exists = self.repo.conversation_exist(conv_id)
        if not exists:
            conv = self.repo.create_conversation(username)
            conv_id = conv.id_conv

        # memoria chat persistente (ultimi messaggi storici)
        previous_messages = self.repo.get_chat_history(conv_id, max_messages=20)
        llm_history = [
            LLMMessage(
                role="user" if msg.sender == SenderEnum.Utente else "assistant",
                content=msg.content,
            )
            for msg in previous_messages
        ]

        # aggiunge il messaggio utente
        message: Message = self.repo.add_message(conv_id, content, SenderEnum.Utente)
        llm_history.append(LLMMessage(role="user", content=message.content))

        user_preferences: list[UserPreference] = []
        if self.storico_service is not None:
            raw_prefs = self.storico_service.get_user_product_preferences(username)
            if raw_prefs:
                single_habitual = len(raw_prefs) == 1 and raw_prefs[0][2] > 3
                for prod_id, prod_name, frequency in raw_prefs[:10]:
                    user_preferences.append(
                        UserPreference(
                            prod_id=prod_id,
                            prod_name=prod_name,
                            frequency=frequency,
                            is_habitual=single_habitual,
                        )
                    )

        request = LLMRequest(
            conversation_id=conv_id,
            message_id=message.id_message or 0,
            username=username,
            user_preferences=user_preferences,
            chat_history=llm_history,
        )

        llm_response = self.llm.invoke_agent(request)

        # aggiunge risposta dell'LLM
        self.repo.add_message(conv_id, llm_response.content, SenderEnum.Chatbot)

        return message
