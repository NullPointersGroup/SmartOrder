from unittest.mock import MagicMock

import pytest
pytest.importorskip("langchain_core")

from src.chat.LLMModels import LLMRequest, LLMResponse
from src.chat.adapters.LLMAdapter import LLMAdapter

#TU-B_221
def test_llm_adapter_invoke_delegates_to_agent():
    agent = MagicMock()
    expected = LLMResponse(content="ok")
    agent.invoke.return_value = expected
    adapter = LLMAdapter(agent=agent)
    request = LLMRequest(conversation_id=1, message_id=2, chat_history=[])

    result = adapter.invoke(request)

    assert result == expected
    agent.invoke.assert_called_once_with(request)
