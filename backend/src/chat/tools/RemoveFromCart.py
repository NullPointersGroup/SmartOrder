from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from src.chat.ports.ToolPort import ToolPortIn


class RemoveFromCartInput(BaseModel):
    prod_id: str = Field(description="Codice identificativo del prodotto da rimuovere dal carrello")


class RemoveFromCartTool(BaseTool):
    name: str = "rimuovi_dal_carrello"
    description: str = "Rimuove completamente un prodotto dal carrello dell'utente dato il suo prod_id."
    args_schema: type[BaseModel] = RemoveFromCartInput
    tool_service: ToolPortIn

    class Config:
        arbitrary_types_allowed = True

    def _run(self, prod_id: str) -> str:
        product = self.tool_service.remove_from_cart(prod_id)
        return f"Prodotto '{product.name}' rimosso dal carrello."

    async def _arun(self, prod_id: str) -> str:
        return self._run(prod_id)