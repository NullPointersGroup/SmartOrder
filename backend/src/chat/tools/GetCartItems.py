from langchain.tools import BaseTool
from pydantic import BaseModel, ConfigDict
from src.chat.ports.ToolPort import ToolPortIn


class GetCartItemsInput(BaseModel):
    pass


class GetCartItemsTool(BaseTool):
    name: str = "mostra_carrello"
    description: str = (
        "Restituisce tutti i prodotti attualmente presenti nel carrello "
        "dell'utente con id, nome e quantità."
    )
    args_schema: type[BaseModel] = GetCartItemsInput
    tool_service: ToolPortIn

    model_config = ConfigDict(arbitrary_types_allowed=True)

    def _run(self) -> str:
        products = self.tool_service.get_cart_items()
        if not products:
            return "Il carrello è vuoto."
        return "\n".join(
            f"- id: {p.prod_id}, nome: {p.name}, quantità: {p.qty}" for p in products
        )

    async def _arun(self) -> str:
        return self._run()
