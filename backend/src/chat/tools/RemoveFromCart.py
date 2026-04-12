from langchain.tools import BaseTool
from pydantic import BaseModel, ConfigDict, Field
from src.cart.exceptions import ProductNotInCartException
from src.chat.ports.ToolCartPortIn import ToolCartPortIn


class RemoveFromCartInput(BaseModel):
    prod_id: str = Field(
        description="Codice identificativo del prodotto da rimuovere dal carrello"
    )


class RemoveFromCartTool(BaseTool):
    name: str = "rimuovi_dal_carrello"
    description: str = "Rimuove completamente un prodotto dal carrello dell'utente dato il suo prod_id."
    args_schema: type[BaseModel] = RemoveFromCartInput
    tool_adapter: ToolCartPortIn

    model_config = ConfigDict(arbitrary_types_allowed=True)

    def _run(self, prod_id: str) -> str:
        msg = f"[DEBUG] rimozione di {prod_id}"
        print(f"\033[30;43m  {msg}  \033[0m")
        try:
            product = self.tool_adapter.remove_from_cart(prod_id)
        except ProductNotInCartException:
            msg = f"[DEBUG] Prodotto {prod_id} non trovato, riferisco ai di prodotto non presente nel carrello"
            print(f"\033[30;43m  {msg}  \033[0m")
            return "Il prodotto non è presente nel carrello."
        return f"Prodotto '{product.name}' rimosso dal carrello."

    async def _arun(self, prod_id: str) -> str:
        return self._run(prod_id)
