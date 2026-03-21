from enum import Enum
from src.chat.enums import SenderEnum, MeasureUnitEnum
from typing import List

from pydantic import BaseModel
from sqlmodel import String


class Product(BaseModel):
    prod_id: int
    qty: int
    name: str
    price: float
    measure_unit: MeasureUnitEnum


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


class CartRequest(BaseModel):
    username: str


class CartResponse(BaseModel):
    username: str
    products: List[Product]
