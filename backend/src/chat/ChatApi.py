from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from src.chat.ChatSchemas import ChatResponse, MessageRequest, MessageResponse
from src.chat.ChatService import ChatService
from src.chat.adapters.LLMAdapter import LLMAdapter
from src.chat.adapters.ChatRepoAdapter import ChatRepoAdapter 
from src.chat.adapters.ChatRepository import ChatRepository 
from src.db.dbConnection import get_conn

router = APIRouter(prefix="/chat", tags=["chat"])


def get_chat_service(db: Session = Depends(get_conn))-> ChatService:
    repo = ChatRepoAdapter(ChatRepository(db))
    llm = LLMAdapter()
    return ChatService(repo=repo, llm=llm)

ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]

@router.get("/{conv_id}/all", response_model=ChatResponse)
def get_all_messages(conv_id: int, chat_service: ChatServiceDep) -> ChatResponse:
    ## TODO Gestione errori tramite HTTPEXception e custom exceptions
    res = chat_service.get_all_messages(conv_id)
    return res


@router.post("/{conv_id}", response_model=MessageResponse)
def send_message(conv_id: int, message: MessageRequest, chat_service: ChatServiceDep) -> MessageResponse:
    return chat_service.send_message(conv_id, message)

