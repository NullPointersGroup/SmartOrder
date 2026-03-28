import pytest
from src.chat.exceptions import ConversationNotFoundException
from src.chat.ChatSchemas import Message
from src.chat.LLMModels import LLMRequest, LLMResponse, Message as LLMMessage
from src.enums import SenderEnum


def test_send_message_returns_llm_response(chat_service, mock_repo, mock_llm):
    mock_repo.conversation_exist.return_value = True
    mock_llm.invoke.return_value = LLMResponse(content="LLM Response")
    mock_repo.add_message.side_effect = [
        Message(id_message=1, content="Hello", sender=SenderEnum.Utente),
        Message(id_message=2, content="LLM Response", sender=SenderEnum.Chatbot),
    ]
    mock_repo.get_messages.return_value = [
        Message(id_message=1, content="Hello", sender=SenderEnum.Utente),
    ]

    result = chat_service.send_message(
        conv_id=1, username="Tom", content="Hello", audio_file=None
    )

    assert result.content == "Hello"
    assert result.sender == SenderEnum.Utente
    mock_llm.invoke.assert_called_once()
    llm_request = mock_llm.invoke.call_args.args[0]
    assert isinstance(llm_request, LLMRequest)
    assert llm_request.conversation_id == 1
    assert llm_request.message_id == 1
    assert llm_request.chat_history == [LLMMessage(role="user", content="Hello")]
    assert mock_repo.add_message.call_count == 2
    mock_repo.create_conversation.assert_not_called()


def test_send_message_creates_conv_if_not_exists(chat_service, mock_repo, mock_llm):
    mock_repo.conversation_exist.return_value = False
    mock_llm.invoke.return_value = LLMResponse(content="LLM response")
    mock_repo.add_message.side_effect = [
        Message(id_message=1, content="Hello", sender=SenderEnum.Utente),
        Message(id_message=2, content="LLM response", sender=SenderEnum.Chatbot),
    ]
    mock_repo.get_messages.return_value = [
        Message(id_message=1, content="Hello", sender=SenderEnum.Utente),
    ]
    chat_service.send_message(
        conv_id=1, username="Tom", content="Hello", audio_file=None
    )
    mock_repo.create_conversation.assert_called_once_with("Tom")


def test_get_all_messages_returns_chat_response(chat_service, mock_repo):
    mock_repo.get_messages.return_value = [
        Message(id_message=1, content="Hello", sender=SenderEnum.Utente),
        Message(id_message=2, content="Response", sender=SenderEnum.Chatbot),
    ]

    result = chat_service.get_all_messages(conv_id=1)

    assert len(result) == 2
    assert result[0].content == "Hello"
    assert result[1].content == "Response"
    mock_repo.get_messages.assert_called_once_with(1)


def test_get_all_messages_empty_conversation(chat_service, mock_repo):
    mock_repo.get_messages.return_value = []
    result = chat_service.get_all_messages(conv_id=1)
    assert result == []


def test_get_all_messages_conv_not_found(chat_service, mock_repo):
    mock_repo.get_messages.side_effect = ConversationNotFoundException(1)
    with pytest.raises(ConversationNotFoundException):
        chat_service.get_all_messages(conv_id=1)
