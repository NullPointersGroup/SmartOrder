from unittest.mock import MagicMock
from sqlmodel import Session
from src.chat.GetAllMessagesCmd import GetAllMessagesCmd
from src.chat.adapters.ChatMessageRepository import ChatMessageRepository 
from src.enums import SenderEnum


def test_get_messages(
    mock_session_with_messages: MagicMock, mock_messaggi: list[ChatMessageRepository]
):
    cmd = GetAllMessagesCmd(id_conv=1)
    query = cmd.execute()

    res = mock_session_with_messages.exec(query).all()
    assert len(res) == 3
    assert res[0].contenuto == "Primo messaggio da Utente"
    assert res[0].mittente == SenderEnum.User
    assert res[0].id_messaggio == 1
    assert res[1].contenuto == "Secondo messaggio da Chatbot"
    assert res[1].mittente == SenderEnum.ChatBot
    assert res[1].id_messaggio == 2
    assert res[2].contenuto == "Terzo messaggio da Utente"
    assert res[2].mittente == SenderEnum.User
    assert res[2].id_messaggio == 3
