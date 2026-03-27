from langchain.tools import BaseTool
from src.chat.exceptions import ToolNotFoundException


class ToolExecutor:
    def __init__(self, tools: list[BaseTool]) -> None:
        self._tools: list[BaseTool] = tools

    def get_tool_by_name(self, tool_name: str) -> BaseTool:
        for tool in self._tools:
            if tool.name == tool_name:
                return tool
        raise ToolNotFoundException(tool_name)

    def execute(self, tool_name: str, args: dict) -> str:
        tool = self.get_tool_by_name(tool_name)
        return tool.invoke(args)