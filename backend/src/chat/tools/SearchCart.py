from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from src.chat.ports.ToolPort import ToolPortIn


class SearchCartInput(BaseModel):
    query: str = Field(description="Nome o descrizione del prodotto da cercare nel carrello")

class SearchCartTool(BaseTool):
    name: str = "cerca_in_carrello"
    description: str = "Cerca prodotti nel carrello dell'utente per nome o descrizione. Restituisce i prodotti trovati con id, nome e quantità."
    args_schema: type[BaseModel] = SearchCartInput
    tool_service: ToolPortIn

    class Config:
        arbitrary_types_allowed = True

    def _run(self, query: str) -> str:
        products = self.tool_service.search_cart(query)
        if not products:
            return "Nessun prodotto trovato nel carrello."
        return "\n".join(
            f"- id: {p.prod_id}, nome: {p.name}, quantità: {p.qty}"
            for p in products
        )

    async def _arun(self, query: str) -> str:
        return self._run(query)