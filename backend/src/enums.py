from enum import Enum


class CartUpdateOperation(Enum):
    Add = 1
    Remove = 2


class SenderEnum(str, Enum):
    Chatbot = "Chatbot"
    Utente = "Utente"


class MeasureUnitEnum(Enum):
    L = 1
    C = 2
    P = 3
    K = 4
