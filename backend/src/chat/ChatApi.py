from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from src.chat.exceptions import ConversationNotFoundException, ToolNotFoundException
from src.chat.ChatSchemas import ChatResponse, MessageRequest, MessageResponse
from src.chat.ChatService import ChatService
from src.chat.adapters.LLMAdapter import LLMAdapter
from src.chat.LLMAgent import LLMAgent
from src.chat.adapters.ChatRepoAdapter import ChatRepoAdapter
from src.chat.adapters.ChatRepository import ChatRepository
from src.db.dbConnection import get_conn
from src.auth.api import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])


def get_chat_service(db: Session = Depends(get_conn)) -> ChatService:
    from src.chat.ToolExecutor import ToolExecutor
    repo = ChatRepoAdapter(ChatRepository(db))
    tool_executor = ToolExecutor(tools=[])
    agent = LLMAgent(tool_executor=tool_executor)
    llm = LLMAdapter(agent=agent)
    return ChatService(repo=repo, llm=llm)
 
ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]

@router.get("/{conv_id}/all")
def get_all_messages(conv_id: int, chat_service: ChatServiceDep) -> ChatResponse:
    try:
        res = chat_service.get_all_messages(conv_id)
        return ChatResponse(messages=res, id_conv=conv_id)
    except ConversationNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

UserServiceCurrentUser = Annotated[str, Depends(get_current_user)]

@router.post("/{conv_id}")
def send_message(
    conv_id: int,
    message: MessageRequest,
    chat_service: ChatServiceDep,
    current_user: UserServiceCurrentUser,
) -> MessageResponse:
    try:
        msg = chat_service.send_message(
            conv_id=conv_id,
            username=current_user,
            content=message.content,
        )
        return MessageResponse(id_conv=conv_id, message=msg)
    except ToolNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))