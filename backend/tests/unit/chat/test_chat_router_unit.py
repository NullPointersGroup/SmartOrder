from unittest.mock import MagicMock

from sqlmodel import Session
from src.chat.ChatApi import get_all_messages, send_message, get_chat_service, ChatService
from src.chat.ChatSchemas import ChatResponse, Message, MessageRequest, MessageResponse
from src.enums import SenderEnum


def test_get_chat_service_unit():
    mock_db = MagicMock(spec=Session)

    service = get_chat_service(db=mock_db)

    assert isinstance(service, ChatService)

def test_get_all_messages_unit():
    test_message = Message(id_message=1, content="Test message", sender=SenderEnum.User)
    message_list = [test_message]
    mock_service = MagicMock()
    mock_service.get_all_messages.return_value = ChatResponse(messages=message_list, id_conv=1 )
    result = get_all_messages(conv_id=1, chat_service=mock_service)
    assert isinstance(result, ChatResponse)
    mock_service.get_all_messages.assert_called_once_with(1)

def test_send_message_unit():
    test_message = Message(id_message=1, content="Test message", sender=SenderEnum.User)
    mock_service = MagicMock()
    mock_service.send_message.return_value = MessageResponse(id_conv=1, message=test_message)
    result = send_message(conv_id=1, message=MessageRequest(username="test", content="Test message", audioFile=None), chat_service=mock_service)
    assert isinstance(result, MessageResponse)
    mock_service.send_message.assert_called_once_with(1, MessageRequest(username='test', content='Test message', audioFile=None))

