from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src.vec.EmbeddedCatalogService import EmbeddedCatalogService
from src.vec.SentenceTransformerEmbedder import SentenceTransformerEmbedder
from src.vec.adapters.CatalogVecDbAdapter import CatalogVecDbAdapter
from src.vec.adapters.EmbedderAdapter import EmbedderAdapter
from src.db.dbConnection import get_conn
from src.vec.adapters.FaissCatalogDb import FaissCatalogDb
from src.auth.limiter import limiter

from typing import Any, AsyncIterator, cast
from starlette.types import ExceptionHandler

from src.auth.api import router as auth_router
from src.catalog.adapters.CatalogRepoAdapter import CatalogRepoAdapter
from src.chat.ChatApi import router as chat_router
from src.cart.CartApi import router as cart_router
from src.catalog.CatalogRepository import CatalogRepository
from src.conversations.ConversationsApi import router as conversations_router
from src.storico.StoricoApi import router as storico_router
from src.recording.RecordingApi import router as recording_router

from fastapi import FastAPI
from contextlib import asynccontextmanager
from src.auth.blocklist import load_blocklist

load_blocklist()

_catalog_repo: CatalogRepoAdapter
_embedded_catalog_service: EmbeddedCatalogService


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    global _catalog_repo, _embedded_catalog_service

    _catalog_repo = CatalogRepoAdapter(CatalogRepository(next(get_conn())))

    # VecDb + load_catalog una sola volta
    _embedded_catalog_service = EmbeddedCatalogService(
        catalog_vect=CatalogVecDbAdapter(faiss_db=FaissCatalogDb()),
        catalog_repo=_catalog_repo,
        embedder=EmbedderAdapter(SentenceTransformerEmbedder()),
    )
    _embedded_catalog_service.load_catalog()

    yield  # app in esecuzione


app = FastAPI(lifespan=lifespan)


app = FastAPI()

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded, cast(ExceptionHandler, _rate_limit_exceeded_handler)
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(cart_router, prefix="/api")
app.include_router(conversations_router, prefix="/api")
app.include_router(storico_router, prefix="/api")
app.include_router(recording_router, prefix="/api")

