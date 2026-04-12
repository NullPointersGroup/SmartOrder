from typing import List

from pydantic import BaseModel


class Message(BaseModel):
    id_message: int | None = None
    content: str
    sender: str


class MessageRequest(BaseModel):
    content: str


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

