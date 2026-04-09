from langchain.tools import BaseTool
from pydantic import BaseModel, Field, ConfigDict
from src.chat.ports.ToolCartPortIn import ToolCartPortIn
from src.cart.exceptions import ProductNotFoundException


class AddToCartInput(BaseModel):
    prod_id: str = Field(description="Codice identificativo del prodotto da aggiungere")
    qty: int = Field(description="Quantità da aggiungere al carrello", gt=0)


class AddToCartTool(BaseTool):
    name: str = "aggiungi_al_carrello"
    description: str = (
        "Aggiunge un prodotto al carrello dell'utente dato il suo prod_id e la quantità."
    )
    args_schema: type[BaseModel] = AddToCartInput
    tool_adapter: ToolCartPortIn

    model_config = ConfigDict(arbitrary_types_allowed=True)

    def _run(self, prod_id: str, qty: int) -> str:
        try:
            product = self.tool_adapter.add_to_cart(prod_id, qty)
        except ProductNotFoundException:
            return "Prodotto non trovato nel catalogo."
        return f"Prodotto '{product.name}' aggiunto al carrello (quantità: {qty})."

    async def _arun(self, prod_id: str, qty: int) -> str:
        return self._run(prod_id, qty)
