from unittest.mock import MagicMock

import sys

mock_module = MagicMock()
mock_module.SentenceTransformer = MagicMock()
sys.modules["sentence_transformers"] = mock_module