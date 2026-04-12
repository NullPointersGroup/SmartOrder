from langchain.tools import BaseTool
from pydantic import BaseModel, ConfigDict, Field
from src.cart.exceptions import ProductNotInCartException
from src.chat.ports.ToolCartPortIn import ToolCartPortIn
from src.enums import CartUpdateOperation


class UpdateCartItemQtyInput(BaseModel):
    prod_id: str = Field(
        description="Codice identificativo del prodotto da aggiornare nel carrello"
    )
    qty: int = Field(description="Quantità da applicare", gt=0)
    operation: CartUpdateOperation = Field(
        description="Operazione di aggiornamento quantità: Add, Remove oppure Set"
    )


class UpdateCartItemQty(BaseTool):
    name: str = "update_cart_item_qty"
    description: str = "Aggiorna la quantità di un prodotto già presente nel carrello aggiungendo, rimuovendo oppure impostando la quantità indicata."
    args_schema: type[BaseModel] = UpdateCartItemQtyInput
    tool_adapter: ToolCartPortIn

    model_config = ConfigDict(arbitrary_types_allowed=True)

    def _run(self, prod_id: str, qty: int, operation: CartUpdateOperation) -> str:
        msg = f"[DEBUG] Aggiornamento di {prod_id}"
        print(f"\033[30;43m  {msg}  \033[0m")
        try:
            product = self.tool_adapter.update_cart_item_qty(prod_id, qty, operation)
        except ProductNotInCartException:
            return "Il prodotto non è presente nel carrello."
        return (
            f"Quantità del prodotto '{product.name}' aggiornata "
            f"(operazione: {operation.name}, quantità applicata: {qty}, quantità attuale: {product.qty})."
        )

    async def _arun(
        self, prod_id: str, qty: int, operation: CartUpdateOperation
    ) -> str:
        return self._run(prod_id, qty, operation)
