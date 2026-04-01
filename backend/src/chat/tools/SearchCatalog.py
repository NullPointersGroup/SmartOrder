from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from src.chat.ports.ToolPort import ToolPortIn 


class SearchCatalogInput(BaseModel):
    query: str = Field(description="Nome o descrizione del prodotto da cercare nel catalogo")

class SearchCatalogTool(BaseTool):
    name: str = "cerca_in_catalogo"
    description: str = "Cerca prodotti nel catalogo per nome o descrizione. Restituisce i prodotti trovati con id, nome e prezzo."
    args_schema: type[BaseModel] = SearchCatalogInput
    tool_service: ToolPortIn

    class Config:
        arbitrary_types_allowed = True

    def _run(self, query: str) -> str:
        products = self.tool_service.search_catalog(query)
        if not products:
            return "Nessun prodotto trovato nel catalogo."
        return "\n".join(
            f"- id: {p.prod_id}, nome: {p.name}, prezzo: {p.price}"
            for p in products
        )

    async def _arun(self, query: str) -> str:
        return self._run(query)