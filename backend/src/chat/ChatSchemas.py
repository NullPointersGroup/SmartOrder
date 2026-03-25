from src.enums import SenderEnum
from typing import List

from pydantic import BaseModel

class Message(BaseModel):
    id_message: int
    content: str
    sender: SenderEnum


class MessageRequest(BaseModel):
    username: str
    content: str
    audioFile: str | None = None


class ChatRequest(BaseModel):
    conv_id: int


class ChatResponse(BaseModel):
    messages: List[Message]
    id_conv: int


class MessageResponse(BaseModel):
    id_conv: int
    message: Message

class Conversation(BaseModel):
    id_conv: int
    username: str
    titolo: str