from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from langchain.tools import BaseTool
from sqlmodel import Session
from src.auth.api import get_current_user
from src.cart.adapters.CartRepoAdapter import CartRepoAdapter
from src.cart.adapters.CartRepository import CartRepository
from src.cart.CartService import CartService
from src.catalog.adapters.CatalogRepoAdapter import CatalogRepoAdapter
from src.catalog.adapters.CatalogRepository import CatalogRepository
from src.chat.adapters.ChatRepoAdapter import ChatRepoAdapter
from src.chat.adapters.ChatRepository import ChatRepository
from src.chat.adapters.LLMAdapter import LLMAdapter
from src.chat.adapters.ToolAdapter import ToolAdapter
from src.chat.ChatSchemas import ChatResponse, MessageRequest, MessageResponse
from src.chat.ChatService import ChatService
from src.chat.exceptions import ConversationNotFoundException, ToolNotFoundException
from src.chat.LLMAgent import LLMAgent
from src.chat.tools.AddToCart import AddToCartTool
from src.chat.tools.GetCartItems import GetCartItemsTool
from src.chat.tools.RemoveFromCart import RemoveFromCartTool
from src.chat.tools.SearchCart import SearchCartTool
from src.chat.tools.SearchCatalog import SearchCatalogTool
from src.chat.tools.ToolService import ToolService
from src.chat.tools.UpdateCartItemQty import UpdateCartItemQty
from src.db.dbConnection import get_conn
from src.vec.adapters.CatalogVecDbAdapter import CatalogVecDbAdapter
from src.vec.adapters.EmbedderAdapter import EmbedderAdapter
from src.vec.adapters.FaissCatalogDb import FaissCatalogDb
from src.vec.adapters.VecDbAdapter import VecDbAdapter
from src.vec.VecDbService import VecDbService

router = APIRouter(prefix="/chat", tags=["chat"])


def build_tools(username: str, db: Session) -> list[BaseTool]:
    cart_service = CartService(repo=CartRepoAdapter(repo=CartRepository(db)))
    catalog_repo = CatalogRepoAdapter(CatalogRepository(db))
    tool_service = ToolService(
        username=username,
        cart_service=cart_service,
        catalog_repo=catalog_repo,
        vec_db=VecDbAdapter(
            VecDbService(
                catalog_vect=CatalogVecDbAdapter(faiss_db=FaissCatalogDb()),
                cart_vect=CatalogVecDbAdapter(faiss_db=FaissCatalogDb()),
                cart_service=cart_service,
                catalog_repo=catalog_repo,
                embedder=EmbedderAdapter(),
            ),
        ),
    )
    tool_adapter = ToolAdapter(tool_service=tool_service)
    get_cart_items = GetCartItemsTool(tool_service=tool_adapter)
    add_to_cart_tool = AddToCartTool(tool_service=tool_adapter)
    remove_from_cart = RemoveFromCartTool(tool_service=tool_adapter)
    search_cart = SearchCartTool(tool_service=tool_adapter)
    search_catalog = SearchCatalogTool(tool_service=tool_adapter)
    update_cart_item_qty = UpdateCartItemQty(tool_service=tool_adapter)
    return [
        get_cart_items,
        add_to_cart_tool,
        remove_from_cart,
        search_cart,
        search_catalog,
        update_cart_item_qty,
    ]


def get_chat_service(
    username: str = Depends(get_current_user), db: Session = Depends(get_conn)
) -> ChatService:
    from src.chat.ToolExecutor import ToolExecutor

    repo = ChatRepoAdapter(ChatRepository(db))
    tool_executor = ToolExecutor(tools=build_tools(username, db))
    agent = LLMAgent(tool_executor=tool_executor)
    llm = LLMAdapter(agent=agent)
    return ChatService(repo=repo, llm=llm)


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
            audio_file=message.audioFile,
        )
        return MessageResponse(id_conv=conv_id, message=msg)
    except ToolNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
