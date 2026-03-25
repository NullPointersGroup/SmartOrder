from enum import Enum


class CartUpdateOperation(Enum):
    Add = 1
    Remove = 2


class SenderEnum(str, Enum):
    Chatbot = "Chatbot"
    Utente = "Utente"


class MeasureUnitEnum(Enum):
    Colli = 1
    Confezioni = 2
    Pezzi = 3
    Chilogrammi = 4
