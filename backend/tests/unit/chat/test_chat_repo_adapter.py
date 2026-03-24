from unittest.mock import MagicMock
from src.chat.adapters.ChatRepoAdapter import ChatRepoAdapter
from src.enums import SenderEnum
from src.chat.ChatSchemas import Message


def make_db_row(id_mess: int, content: str, sender: SenderEnum):
    row = MagicMock()
    row.id_messaggio = id_mess
    row.contenuto = content
    row.mittente = sender
    return row


def test_get_messages_returns_mapped_messages(adapter, mock_repo):
    mock_repo.get_messages.return_value = [
        make_db_row(1, "Hello", SenderEnum.User),
        make_db_row(2, "Hello from chatbot!", SenderEnum.ChatBot),
    ]
    result = adapter.get_messages(conv_id=1)

    assert len(result) == 2
    assert isinstance(result[0], Message)
    assert result[0].id_message == 1
    assert result[0].content == "Hello"
    assert result[0].sender == SenderEnum.User
    assert result[1].id_message == 2
    assert result[1].sender == SenderEnum.ChatBot
    mock_repo.get_messages.assert_called_once_with(1)


def test_get_messages_returns_empty_list(adapter, mock_repo):
    mock_repo.get_messages.return_value = []

    result = adapter.get_messages(conv_id=99)

    assert result == []
    mock_repo.get_messages.assert_called_once_with(99)


def test_add_message_returns_mapped_message(adapter, mock_repo):
    mock_repo.add_message.return_value = make_db_row(1, "Hello", SenderEnum.User)

    result = adapter.add_message(conv_id=1, text="Hello", sender=SenderEnum.User)

    assert isinstance(result, Message)
    assert result.id_message == 1
    assert result.content == "Hello"
    assert result.sender == SenderEnum.User
    mock_repo.add_message.assert_called_once_with(1, "Hello", SenderEnum.User)


def test_add_message_chatbot_sender(adapter, mock_repo):
    mock_repo.add_message.return_value = make_db_row(
        2, "LLm answer", SenderEnum.ChatBot
    )

    result = adapter.add_message(
        conv_id=1, text="LLm answer", sender=SenderEnum.ChatBot
    )

    assert result.sender == SenderEnum.ChatBot
    assert result.content == "LLm answer"


def test_conversation_exist_return_true(mock_repo):
    mock_repo.get_conversation.return_value = MagicMock()
    adapter = ChatRepoAdapter(mock_repo)

    result = adapter.conversation_exist(1)

    assert result is True
    mock_repo.get_conversation.assert_called_once_with(1)


def test_conversation_exist_return_false(mock_repo):
    mock_repo.get_conversation.return_value = None
    adapter = ChatRepoAdapter(mock_repo)
    result = adapter.conversation_exist(1)
    assert result is False
    mock_repo.get_conversation.assert_called_once_with(1)


def test_create_conversation(adapter, mock_repo):
    adapter.create_conversation("test_user")
    mock_repo.create_conversation.assert_called_once_with("test_user")
