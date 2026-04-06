from unittest.mock import MagicMock, patch

import pytest
pytest.importorskip("langchain")

from fastapi import HTTPException
from sqlmodel import Session
from src.chat.exceptions import ConversationNotFoundException, ToolNotFoundException
from src.chat.ChatApi import (
    get_all_messages,
    send_message,
    get_chat_service,
    ChatService,
)
from src.chat.ChatSchemas import ChatResponse, Message, MessageRequest, MessageResponse
from src.enums import SenderEnum
from src.db.models import Utentiweb

#TU-B_203
def test_get_chat_service_unit():
    mock_db = MagicMock(spec=Session)

    with patch("src.chat.ChatApi.build_tools", return_value=[]):
        service = get_chat_service(username="test", db=mock_db)

    assert isinstance(service, ChatService)

#TU-B_204
def test_get_all_messages_unit():
    test_message = Message(id_message=1, content="Test message", sender=SenderEnum.Utente)
    message_list = [test_message]
    mock_service = MagicMock()
    mock_service.get_all_messages.return_value = message_list
    result = get_all_messages(conv_id=1, chat_service=mock_service)
    assert isinstance(result, ChatResponse)
    mock_service.get_all_messages.assert_called_once_with(1)

#TU-B_205
def test_send_message_unit():
    test_message = Message(
        id_message=1,
        content="Test message",
        sender=SenderEnum.Utente
    )

    mock_service = MagicMock()
    mock_service.send_message.return_value = test_message

    result = send_message(
        conv_id=1,
        message=MessageRequest(
            content="Test message",
        ),
        chat_service=mock_service,
        current_user="test",  # stringa, coerente col tipo
    )

    assert isinstance(result, MessageResponse)

    mock_service.send_message.assert_called_once_with(
        conv_id=1,
        username="test",
        content="Test message",
    )

#TU-B_206
def test_get_all_messages_from_inexistent_conv():
    mock_service = MagicMock()
    mock_service.get_all_messages.side_effect = ConversationNotFoundException(1)

    with pytest.raises(HTTPException) as info:
        get_all_messages(conv_id=1, chat_service=mock_service)
    assert info.value.status_code == 404
    assert "1" in info.value.detail

#TU-B_207
def test_send_message_returns_500_when_tool_is_missing():
    mock_service = MagicMock()
    mock_service.send_message.side_effect = ToolNotFoundException("search")

    with pytest.raises(HTTPException) as info:
        send_message(
            conv_id=1,
            message=MessageRequest(content="Test message"),
            chat_service=mock_service,
            current_user="test",
        )

    assert info.value.status_code == 500
    assert "search" in info.value.detail
