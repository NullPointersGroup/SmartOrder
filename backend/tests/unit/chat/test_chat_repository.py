from src.db.models import Messaggi
from src.enums import SenderEnum


def make_chat_message(id_conv: int, id_mess: int, content: str, sender: SenderEnum):
    msg = Messaggi(
            id_conv=id_conv,
            id_messaggio=id_mess,
            contenuto=content, 
            mittente=sender
            )
    return msg

#TU-B_198
def test_get_messages_calls_db(chat_repository, mock_db):
    mock_db.exec.return_value.all.return_value = []

    result = chat_repository.get_messages(conv_id=1)

    assert result == []
    mock_db.exec.assert_called_once()

#TU-B_199
def test_get_messages_returns_list(chat_repository, mock_db):
    rows = [
            make_chat_message(1, 1, "Hello", SenderEnum.Utente),
            make_chat_message(1, 2, "Answer", SenderEnum.Chatbot),
    ]

    mock_db.exec.return_value.all.return_value = rows

    result = chat_repository.get_messages(conv_id=1)

    assert isinstance(result, list)
    assert len(result) == 2
    assert result[0].contenuto == "Hello"
    assert result[1].mittente ==  SenderEnum.Chatbot

#TU-B_200
def test_add_message_calls_and_commit_refresh(chat_repository, mock_db):
    chat_repository.add_message(conv_id=1, text="Hello", sender=SenderEnum.Utente)

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()

#TU-B_201
def test_add_message_returns_chat_message_repository(chat_repository, mock_db):
    result = chat_repository.add_message(conv_id=1, text="Hello", sender=SenderEnum.Utente)

    assert isinstance(result, Messaggi)

#TU-B_202
def test_add_message_correct_fields(chat_repository, mock_db):
    result = chat_repository.add_message(conv_id=1, text="Hello", sender=SenderEnum.Utente)

    assert result.id_conv == 1
    assert result.contenuto == "Hello"
    assert result.mittente == SenderEnum.Utente


