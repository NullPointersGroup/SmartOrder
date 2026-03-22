from src.chat.ChatSchemas import ChatResponse, MessageRequest, MessageResponse
from src.chat.enums import SenderEnum
from src.chat.ports.ChatRepoPort import ChatRepoPort
from src.chat.ports.LLMPort import LLMPort


class ChatService:
    def __init__(self, repo: ChatRepoPort, llm: LLMPort) -> None:
        self.repo = repo
        self.llm = llm

    def get_all_messages(self, conv_id: int) -> ChatResponse:
        messages = self.repo.get_messages(conv_id)
        return ChatResponse(id_conv=conv_id, messages=messages)

    def send_message(self, conv_id: int, req: MessageRequest) -> MessageResponse:
        self.repo.add_message(conv_id, req.content, SenderEnum.User)
        llm_response = self.llm.invoke_agent(req.content)
        bot_message = self.repo.add_message(conv_id, llm_response, SenderEnum.ChatBot)
        return MessageResponse(id_conv=conv_id, message=bot_message)
