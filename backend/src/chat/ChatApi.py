from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List

from backend.src.chat.exceptions import ConversationNotFoundException
from src.chat.ChatSchemas import ChatResponse, MessageRequest, MessageResponse
from src.chat.ChatService import ChatService
from src.chat.adapters.LLMAdapter import LLMAdapter
from src.chat.adapters.ChatRepoAdapter import ChatRepoAdapter
from src.chat.adapters.ChatRepository import ChatRepository
from src.db.dbConnection import get_conn

router = APIRouter(prefix="/chat", tags=["chat"])


def get_chat_service(db: Session = Depends(get_conn)) -> ChatService:
    repo = ChatRepoAdapter(ChatRepository(db))
    llm = LLMAdapter()
    return ChatService(repo=repo, llm=llm)


ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]


@router.get("/{conv_id}/all", response_model=ChatResponse)
def get_all_messages(conv_id: int, chat_service: ChatServiceDep) -> ChatResponse:
    try:
        res = chat_service.get_all_messages(conv_id)
        return ChatResponse(messages=res, id_conv=conv_id)
    except ConversationNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{conv_id}", response_model=MessageResponse)
def send_message(
    conv_id: int, request: MessageRequest, chat_service: ChatServiceDep
) -> MessageResponse:
    message = chat_service.send_message(
        conv_id, request.username, request.content, request.audioFile
    )
    return MessageResponse(id_conv=conv_id, message=message)
