from src.enums import SenderEnum
from src.db.models import Conversazione
from src.chat.adapters.ChatRepository import ChatRepository
from src.chat.adapters.ChatMessageRepository import ChatMessageRepository

def test_get_messages_empty(chat_repository):
    result = chat_repository.get_messages(conv_id=1)
    assert result == []

def test_get_messages_returns_inserted_messages(chat_repository):
    chat_repository.add_message(conv_id=1, text="Ciao", sender=SenderEnum.User)
    chat_repository.add_message(conv_id=1, text="Risposta", sender=SenderEnum.ChatBot)

    result = chat_repository.get_messages(conv_id=1)

    assert len(result) == 2
    assert result[0].contenuto == "Ciao"
    assert result[0].mittente == SenderEnum.User
    assert result[1].contenuto == "Risposta"
    assert result[1].mittente == SenderEnum.ChatBot

def test_get_messages_only_returns_correct_conv(seeded_db):
    conv2 = Conversazione(id_conv=2, username="mario")
    seeded_db.add(conv2)
    seeded_db.commit()

    repo = ChatRepository(db=seeded_db)
    repo.add_message(conv_id=1, text="Messaggio conv 1", sender=SenderEnum.User)
    repo.add_message(conv_id=2, text="Messaggio conv 2", sender=SenderEnum.User)

    result = repo.get_messages(conv_id=1)

    assert len(result) == 1
    assert result[0].contenuto == "Messaggio conv 1"

def test_add_message_persists_to_db(chat_repository, seeded_db):
    chat_repository.add_message(conv_id=1, text="Ciao", sender=SenderEnum.User)

    result = seeded_db.get(ChatMessageRepository, (1, 1))
    assert result is not None
    assert result.contenuto == "Ciao"

def test_add_message_returns_with_generated_id(chat_repository):
    result = chat_repository.add_message(conv_id=1, text="Ciao", sender=SenderEnum.User)

    assert result.id_messaggio is not None
    assert isinstance(result.id_messaggio, int)

def test_add_message_increments_id(chat_repository):
    msg1 = chat_repository.add_message(conv_id=1, text="Primo", sender=SenderEnum.User)
    msg2 = chat_repository.add_message(conv_id=1, text="Secondo", sender=SenderEnum.User)

    assert msg2.id_messaggio > msg1.id_messaggio
