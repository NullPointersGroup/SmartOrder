from enum import Enum
from typing import List

from pydantic import BaseModel
from sqlmodel import String


class MeasureUnit(Enum):
    COLLI = 1
    CONFEZIONI = 2
    PEZZI = 3


class Sender(Enum):
    CHATBOT = 1
    USER = 2


class Product(BaseModel):
    prod_id: int
    qty: int
    name: str
    price: float
    measure_unit: MeasureUnit


class Message(BaseModel):
    id_message: int
    content: str
    sender: Sender


class MessageRequest(BaseModel):
    username: str
    content: str
    audioFile: str


class ChatRequest(BaseModel):
    conv_id: int


class ChatResponse(BaseModel):
    messages: List[Message]
    id_conv: int


class CartRequest(BaseModel):
    username: str


class CartResponse(BaseModel):
    username: str
    products: List[Product]
