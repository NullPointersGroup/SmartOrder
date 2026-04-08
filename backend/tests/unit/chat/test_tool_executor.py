import pytest
pytest.importorskip("langchain")

from src.chat.ToolExecutor import ToolExecutor
from src.chat.exceptions import ToolNotFoundException


class FakeTool:
    def __init__(self, name: str, result: str) -> None:
        self.name = name
        self._result = result
        self.invocations: list[dict] = []

    def invoke(self, args: dict) -> str:
        self.invocations.append(args)
        return self._result

#TU-B_225
def test_get_tool_by_name_returns_matching_tool():
    target_tool = FakeTool(name="search", result="done")
    executor = ToolExecutor(tools=[target_tool, FakeTool(name="other", result="x")])

    result = executor.get_tool_by_name("search")

    assert result is target_tool

#TU-B_226
def test_execute_invokes_selected_tool_with_args():
    tool = FakeTool(name="search", result="done")
    executor = ToolExecutor(tools=[tool])

    result = executor.execute("search", {"query": "pasta"})

    assert result == "done"
    assert tool.invocations == [{"query": "pasta"}]

#TU-B_227
def test_get_tool_by_name_raises_when_missing():
    executor = ToolExecutor(tools=[])

    with pytest.raises(ToolNotFoundException):
        executor.get_tool_by_name("missing")
