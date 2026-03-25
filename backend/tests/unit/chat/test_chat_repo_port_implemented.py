from src.chat.ports.ChatRepoPort import ChatRepoPort
from src.chat.ChatSchemas import Message
from src.enums import SenderEnum

message1 = Message(id_message=1, content="Test message 1", sender=SenderEnum.Utente)
message2 = Message(id_message=2, content="Test message 2", sender=SenderEnum.Chatbot)


class ConcreteChatRepo(ChatRepoPort):
    def get_messages(self, conv_id: int) -> list[Message]:
        messages = [message1, message2]
        return messages

    def add_message(self, conv_id: int, text: str, sender: SenderEnum) -> Message:
        return Message(id_message=1, content=text, sender=sender)

    ## TODO create_conversation deve ritornare Conversation (tipo di dominio)
    def create_conversation(self, username: str):
        pass

    def conversation_exist(self, conv_id: int) -> bool:
        return True


def test_get_messages_can_be_implemented():
    chat_repo = ConcreteChatRepo()
    message_list = [message1, message2]
    result = chat_repo.get_messages(1)
    assert result == message_list


def test_add_message_can_be_implemented():
    chat_repo = ConcreteChatRepo()
    message = message1
    result = chat_repo.add_message(
        conv_id=1, text=message.content, sender=SenderEnum.Utente
    )
    assert result == message


def test_get_messages_returns_message_list():
    chat_repo = ConcreteChatRepo()
    result = chat_repo.get_messages(1)
    assert isinstance(result, list)
    assert all(isinstance(m, Message) for m in result)


def test_add_message_returns_message():
    chat_repo = ConcreteChatRepo()
    message = message1
    result = chat_repo.add_message(
        conv_id=1, text=message.content, sender=SenderEnum.Utente
    )
    assert isinstance(result, Message)
