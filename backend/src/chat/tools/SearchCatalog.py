from langchain.tools import BaseTool
from pydantic import BaseModel, Field, ConfigDict
from src.chat.ports.ToolPort import ToolPortIn


class SearchCatalogInput(BaseModel):
    query: str = Field(
        description="Nome o descrizione del prodotto da cercare nel catalogo"
    )
    threshold: float = Field(
        description="Soglia di specificità di un prodotto tra 0 e 1.5"
    )


class SearchCatalogTool(BaseTool):
    name: str = "cerca_in_catalogo"
    description: str = "Cerca prodotti nel catalogo per nome o descrizione. Restituisce i prodotti trovati con id, nome e prezzo."
    args_schema: type[BaseModel] = SearchCatalogInput
    tool_service: ToolPortIn

    model_config = ConfigDict(arbitrary_types_allowed=True)

    def _run(self, query: str, threshold: float = 1.5) -> str:
        msg = f"[DEBUG] L'AI usa il threshold: {threshold} per cercare il prodotto: {query} nel catalogo"
        print(f"\033[30;43m  {msg}  \033[0m")
        products = self.tool_service.search_catalog(query, threshold)
        if not products:
            return "Nessun prodotto trovato nel catalogo."
        return "\n".join(
            f"- id: {p.prod_id}, nome: {p.name}, prezzo: {p.price}" for p in products
        )

    async def _arun(self, query: str, threshold: float) -> str:
        return self._run(query, threshold)
