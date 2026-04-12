from langchain.tools import BaseTool
from pydantic import BaseModel, ConfigDict, Field
from src.cart.exceptions import ProductNotFoundException
from src.chat.ports.ToolCartPortIn import ToolCartPortIn


class AddToCartInput(BaseModel):
    prod_id: str = Field(description="Codice identificativo del prodotto da aggiungere")
    qty: int = Field(description="Quantità da aggiungere al carrello", gt=0)


class AddToCartTool(BaseTool):
    name: str = "aggiungi_al_carrello"
    description: str = "Aggiunge un prodotto al carrello dell'utente dato il suo prod_id e la quantità."
    args_schema: type[BaseModel] = AddToCartInput
    tool_adapter: ToolCartPortIn

    model_config = ConfigDict(arbitrary_types_allowed=True)

    def _run(self, prod_id: str, qty: int) -> str:
        msg = f"[DEBUG] Aggiunta di {prod_id}"
        print(f"\033[30;43m  {msg}  \033[0m")
        try:
            product = self.tool_adapter.add_to_cart(prod_id, qty)
        except ProductNotFoundException:
            return "Prodotto non trovato nel catalogo."
        return f"Prodotto '{product.name}' aggiunto al carrello (quantità: {qty})."

    async def _arun(self, prod_id: str, qty: int) -> str:
        return self._run(prod_id, qty)
