from unittest.mock import MagicMock
import pytest
from src.chat.ChatService import ChatService
from src.chat.ChatSchemas import Message, MessageRequest
from src.enums import SenderEnum

def test_send_message_returns_llm_response(chat_service, mock_repo ,mock_llm):
    mock_llm.invoke_agent.return_value= "LLM Response"
    mock_repo.add_message.return_value = Message(
            id_message=1, content="LLM Response", sender=SenderEnum.ChatBot
    )
    req=MessageRequest(username="Tom", content="Hello")

    result = chat_service.send_message(conv_id=1, req=req)

    assert result.message.content=="LLM Response"
    assert result.message.sender==SenderEnum.ChatBot
    mock_llm.invoke_agent.assert_called_once_with("Hello")
    assert mock_repo.add_message.call_count == 2

def test_get_all_messages_returns_chat_response(chat_service, mock_repo):
    mock_repo.get_messages.return_value = [
            Message(id_message=1, content="Hello", sender=SenderEnum.User),
            Message(id_message=2, content="Response", sender=SenderEnum.ChatBot)
            ]

    result = chat_service.get_all_messages(conv_id=1)

    assert result.id_conv == 1
    assert len(result.messages)==2
