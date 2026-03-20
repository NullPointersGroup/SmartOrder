from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status

from src.chat.ChatSchemas import ChatResponse, Message, MessageRequest
from src.chat.ChatService import ChatService

ChatServiceDep = Annotated[ChatService, Depends(ChatService)]
router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/{conv_id}/all", response_model=ChatResponse)
def get_all_messages(conv_id: int, chatService: ChatServiceDep):
    ## TODO Gestione errori tramite HTTPEXception e custom exceptions
    res = chatService.get_all_messages(conv_id)
    return res


@router.post("/{conv_id}/message", response_model=ChatResponse)
def send_message(conv_id: int, message: MessageRequest, chatService: ChatServiceDep):
    return chatService.send_message(conv_id, message)
