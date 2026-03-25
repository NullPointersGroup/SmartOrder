from enum import Enum


class SenderEnum(str, Enum):
    ChatBot = "ChatBot"
    User = "User"


class MeasureUnitEnum(Enum):
    Colli = 1
    Confezioni = 2
    Pezzi = 3
