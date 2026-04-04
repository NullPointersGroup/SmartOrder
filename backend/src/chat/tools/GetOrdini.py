from datetime import date

from langchain.tools import BaseTool
from pydantic import BaseModel, Field

from src.chat.ports.ToolPort import ToolPortIn
from src.storico.exceptions import OrdiniUsernameNotFoundException


class GetOrdiniInput(BaseModel):
    data_inizio: str = Field(
        default="",
        description="Data inizio filtro in formato YYYY-MM-DD. Stringa vuota per nessun filtro.",
    )
    data_fine: str = Field(
        default="",
        description="Data fine filtro in formato YYYY-MM-DD. Stringa vuota per nessun filtro.",
    )
    pagina: int = Field(
        default=1,
        ge=1,
        description="Numero di pagina da restituire (default 1).",
    )


class GetOrdiniTool(BaseTool):
    name: str = "get_ordini"
    description: str = (
        "Restituisce lo storico degli ordini dell'utente con codice ordine, data, "
        "elenco prodotti e quantita ordinata. Supporta filtro opzionale per data "
        "inizio/fine e paginazione."
    )
    args_schema: type[BaseModel] = GetOrdiniInput
    tool_service: ToolPortIn

    class Config:
        arbitrary_types_allowed = True

    @staticmethod
    def _parse_date(s: str) -> date | None:
        if not s:
            return None
        try:
            return date.fromisoformat(s)
        except ValueError:
            return None

    def _run(
        self,
        data_inizio: str = "",
        data_fine: str = "",
        pagina: int = 1,
    ) -> str:
        try:
            result = self.tool_service.get_ordini(
                pagina=pagina,
                data_inizio=self._parse_date(data_inizio),
                data_fine=self._parse_date(data_fine),
            )
        except OrdiniUsernameNotFoundException:
            return "Nessun ordine trovato per questo utente."

        if not result.ordini:
            return "Nessun ordine trovato."

        lines = []
        for ordine in result.ordini:
            prodotti_str = ", ".join(
                f"{p.nome} x{int(p.quantita)}" for p in ordine.prodotti
            )
            riga = f"- Ordine {ordine.codice_ordine}"
            if ordine.data:
                riga += f" del {ordine.data}"
            riga += f": {prodotti_str}" if prodotti_str else ": nessun prodotto"
            lines.append(riga)

        output = "\n".join(lines)
        output += f"\n(Pagina {result.pagina_corrente} di {result.totale_pagine})"
        if result.totale_pagine > result.pagina_corrente:
            output += " — ci sono altre pagine disponibili."

        return output

    async def _arun(
        self,
        data_inizio: str = "",
        data_fine: str = "",
        pagina: int = 1,
    ) -> str:
        return self._run(data_inizio, data_fine, pagina)
