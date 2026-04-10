from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from langchain.tools import BaseTool
from sqlmodel import Session
from src import dependencies
from src.auth.api import get_current_user
from src.cart.adapters.CartRepoAdapter import CartRepoAdapter
from src.cart.adapters.CartRepository import CartRepository
from src.cart.CartService import CartService
from src.cart.ports.CartRepoPort import CartRepoPort
from src.catalog.adapters.CatalogRepoAdapter import CatalogRepoAdapter
from src.chat.adapters.ChatRepoAdapter import ChatRepoAdapter
from src.chat.adapters.ChatRepository import ChatRepository
from src.chat.adapters.LLMAdapter import LLMAdapter
from src.chat.adapters.ToolCartAdapter import ToolCartAdapter
from src.chat.adapters.ToolCatalogAdapter import ToolCatalogAdapter
from src.chat.adapters.ToolOrderAdapter import ToolOrderAdapter
from src.chat.ChatSchemas import ChatResponse, MessageRequest, MessageResponse
from src.chat.ChatService import ChatService
from src.chat.exceptions import ConversationNotFoundException, ToolNotFoundException
from src.chat.LLMAgent import LLMAgent
from src.chat.tools.AddToCart import AddToCartTool
from src.chat.tools.GetCartItems import GetCartItemsTool
from src.chat.tools.GetOrdini import GetOrdiniTool
from src.chat.tools.RemoveFromCart import RemoveFromCartTool
from src.chat.tools.SearchCart import SearchCartTool
from src.chat.tools.SearchCatalog import SearchCatalogTool
from src.chat.tools.ToolCartService import ToolCartService
from src.chat.tools.ToolCatalogService import ToolCatalogService
from src.chat.tools.ToolOrderService import ToolOrderService
from src.chat.tools.UpdateCartItemQty import UpdateCartItemQty
from src.db.dbConnection import get_conn
from src.storico.adapters.GetOrdiniAdapter import GetOrdiniAdapter
from src.storico.StoricoService import StoricoService
from src.vec.adapters.CartVecDbAdapter import CartVecDbAdapter
from src.vec.adapters.EmbedderAdapter import EmbedderAdapter
from src.vec.adapters.FaissCartDb import FaissCartDb
from src.vec.EmbeddedCartService import EmbeddedCartService
from src.vec.SentenceTransformerEmbedder import SentenceTransformerEmbedder

router = APIRouter(prefix="/chat", tags=["chat"])

embedded_cart_service: EmbeddedCartService | None = None


def get_cart_services() -> tuple[CartService, CartRepoPort]:

    cart_service = CartService(
        adapter=CartRepoAdapter(repo=CartRepository(next(get_conn())))
    )

    cart_repo_port = CartRepoAdapter(repo=CartRepository(next(get_conn())))

    return cart_service, cart_repo_port


def build_tools(username: str, db: Session) -> list[BaseTool]:

    cart_service, cart_repo = get_cart_services()
    embedded_cart_service: EmbeddedCartService = EmbeddedCartService(
        CartVecDbAdapter(faiss_db=FaissCartDb(), username=username),
        cart_repo=cart_repo,
        embedder=EmbedderAdapter(
            sentence_transformer_embedder=SentenceTransformerEmbedder()
        ),
    )
    shared_catalog_repo = dependencies.catalog_repo
    shared_embedded_catalog = dependencies.embedded_catalog_service
    storico_service = StoricoService(GetOrdiniAdapter(db))
    preferred_product_frequency = {
        prod_id: frequency
        for prod_id, _, frequency in storico_service.get_user_product_preferences(
            username
        )
    }

    tool_catalog_service = ToolCatalogService(
        shared_embedded_catalog, shared_catalog_repo, preferred_product_frequency
    )
    tool_cart_service = ToolCartService(username, cart_repo, embedded_cart_service)
    tool_order_service = ToolOrderService(username, storico_service)

    tool_cart_adapter = ToolCartAdapter(tool_cart_service)
    tool_catalog_adapter = ToolCatalogAdapter(tool_catalog_service)
    tool_order_adapter = ToolOrderAdapter(tool_order_service)

    tools: list[BaseTool] = [
        GetCartItemsTool(tool_adapter=tool_cart_adapter),
        AddToCartTool(tool_adapter=tool_cart_adapter),
        RemoveFromCartTool(tool_adapter=tool_cart_adapter),
        UpdateCartItemQty(tool_adapter=tool_cart_adapter),
        GetOrdiniTool(tool_adapter=tool_order_adapter),
        SearchCartTool(tool_adapter=tool_cart_adapter),
        SearchCatalogTool(tool_adapter=tool_catalog_adapter),
    ]

    return tools


def get_chat_service(
    username: str = Depends(get_current_user), db: Session = Depends(get_conn)
) -> ChatService:
    from src.chat.ToolExecutor import ToolExecutor

    repo = ChatRepoAdapter(ChatRepository(db))
    storico_service = StoricoService(GetOrdiniAdapter(db))
    tool_executor = ToolExecutor(tools=build_tools(username, db))
    agent = LLMAgent(tool_executor=tool_executor)
    llm = LLMAdapter(agent=agent)
    return ChatService(repo=repo, llm=llm, storico_service=storico_service)


ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]


@router.get("/{conv_id}/all")
def get_all_messages(conv_id: int, chat_service: ChatServiceDep) -> ChatResponse:
    try:
        res = chat_service.get_all_messages(conv_id)
        return ChatResponse(messages=res, id_conv=conv_id)
    except ConversationNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


UserServiceCurrentUser = Annotated[str, Depends(get_current_user)]


@router.post("/{conv_id}")
def send_message(
    conv_id: int,
    message: MessageRequest,
    chat_service: ChatServiceDep,
    current_user: UserServiceCurrentUser,
) -> MessageResponse:
    try:
        msg = chat_service.send_message(
            conv_id=conv_id,
            username=current_user,
            content=message.content,
        )
        return MessageResponse(id_conv=conv_id, message=msg)
    except ToolNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
