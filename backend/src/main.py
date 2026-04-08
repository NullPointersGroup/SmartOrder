from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from src.auth.limiter import limiter

from typing import cast
from starlette.types import ExceptionHandler

from src.auth.api import router as auth_router
from src.chat.ChatApi import router as chat_router
from src.cart.CartApi import router as cart_router
from src.conversations.ConversationsApi import router as conversations_router
from src.storico.StoricoApi import router as storico_router
from src.recording.RecordingApi import router as recording_router

from src.auth.blocklist import load_blocklist

load_blocklist()


app = FastAPI()

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    cast(ExceptionHandler, _rate_limit_exceeded_handler)
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,          prefix="/api")
app.include_router(chat_router,          prefix="/api")
app.include_router(cart_router,          prefix="/api")
app.include_router(conversations_router, prefix="/api")
app.include_router(storico_router,       prefix="/api")
app.include_router(recording_router,     prefix="/api")