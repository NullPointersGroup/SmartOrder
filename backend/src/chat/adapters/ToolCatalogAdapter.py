from backend.src.chat.ports.ToolCatalogPortIn import ToolCatalogPortIn
from src.chat.tools.ToolCatalogService import ToolCatalogService
from src.catalog.CatalogSchemas import CatalogProduct


class ToolCatalogAdapter(ToolCatalogPortIn):
    def __init__(self, tool_catalog_service: ToolCatalogService) -> None:
        super().__init__()
        self.tool_catalog_service = tool_catalog_service

    def search_catalog(self, query: str, threshold: float) -> list[CatalogProduct]:
        return self.tool_catalog_service.search_catalog(query, threshold)
