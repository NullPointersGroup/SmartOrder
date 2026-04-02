from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from src.chat.ports.ToolPort import ToolPortIn
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
    description: str = (
        "Aggiorna la quantità di un prodotto già presente nel carrello aggiungendo, rimuovendo oppure impostando la quantità indicata."
    )
    args_schema: type[BaseModel] = UpdateCartItemQtyInput
    tool_service: ToolPortIn

    class Config:
        arbitrary_types_allowed = True

    def _run(self, prod_id: str, qty: int, operation: CartUpdateOperation) -> str:
        product = self.tool_service.update_cart_item_qty(prod_id, qty, operation)
        return (
            f"Product '{product.name}' cart quantity updated "
            f"(operation: {operation.name}, qty: {qty}, current qty: {product.qty})."
        )

    async def _arun(
        self, prod_id: str, qty: int, operation: CartUpdateOperation
    ) -> str:
        return self._run(prod_id, qty, operation)
