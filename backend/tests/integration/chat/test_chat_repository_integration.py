from src.enums import SenderEnum
from src.db.models import Conversazione
from src.chat.adapters.ChatRepository import ChatRepository
from src.chat.adapters.ChatMessageRepository import ChatMessageRepository

def test_get_messages_empty(chat_repository):
    result = chat_repository.get_messages(conv_id=1)
    assert result == []

def test_get_messages_returns_inserted_messages(chat_repository):
    chat_repository.add_message(conv_id=1, text="Ciao", sender=SenderEnum.Utente)
    chat_repository.add_message(conv_id=1, text="Risposta", sender=SenderEnum.Chatbot)

    result = chat_repository.get_messages(conv_id=1)

    assert len(result) == 2
    assert result[0].contenuto == "Ciao"
    assert result[0].mittente == SenderEnum.Utente
    assert result[1].contenuto == "Risposta"
    assert result[1].mittente == SenderEnum.Chatbot

def test_get_messages_only_returns_correct_conv(seeded_db):
    conv2 = Conversazione(username="mario", titolo="test")
    seeded_db.add(conv2)
    seeded_db.commit()

    repo = ChatRepository(db=seeded_db)
    repo.add_message(conv_id=1, text="Messaggio conv 1", sender=SenderEnum.Utente)
    repo.add_message(conv_id=2, text="Messaggio conv 2", sender=SenderEnum.Utente)

    result = repo.get_messages(conv_id=1)

    assert len(result) == 1
    assert result[0].contenuto == "Messaggio conv 1"

def test_add_message_persists_to_db(chat_repository, seeded_db):
    chat_repository.add_message(conv_id=1, text="Ciao", sender=SenderEnum.Utente)

    result = seeded_db.get(ChatMessageRepository, (1, 1))
    assert result is not None
    assert result.contenuto == "Ciao"

def test_add_message_returns_with_generated_id(chat_repository):
    result = chat_repository.add_message(conv_id=1, text="Ciao", sender=SenderEnum.Utente)

    assert result.id_messaggio is not None
    assert isinstance(result.id_messaggio, int)

def test_add_message_increments_id(chat_repository):
    msg1 = chat_repository.add_message(conv_id=1, text="Primo", sender=SenderEnum.Utente)
    msg2 = chat_repository.add_message(conv_id=1, text="Secondo", sender=SenderEnum.Utente)

    assert msg2.id_messaggio > msg1.id_messaggio
