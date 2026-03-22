from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status

from src.chat.ChatSchemas import ChatResponse, MessageRequest, MessageResponse
from src.chat.ChatService import ChatService

ChatServiceDep = Annotated[ChatService, Depends(ChatService)]
router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/{conv_id}/all", response_model=ChatResponse)
def get_all_messages(conv_id: int, chat_service: ChatServiceDep):
    ## TODO Gestione errori tramite HTTPEXception e custom exceptions
    res = chat_service.get_all_messages(conv_id)
    return res


@router.post("/{conv_id}", response_model=MessageResponse)
def send_message(conv_id: int, message: MessageRequest, chat_service: ChatServiceDep):
    return chat_service.send_message(conv_id, message)
