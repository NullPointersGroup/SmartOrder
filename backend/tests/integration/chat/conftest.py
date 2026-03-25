import pytest
from src.chat.adapters.ChatRepository import ChatRepository

@pytest.fixture
def chat_repository(seeded_db):
    return ChatRepository(db=seeded_db)

