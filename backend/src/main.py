from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from src.auth.api import router as auth_router
from src.chat.ChatApi import router as chat_router
from src.cart.CartApi import router as cart_router
from src.conversations.ConversationsApi import router as conversations_router
from src.storico.StoricoApi import router as storico_router
from src.recording.RecordingApi import router as recording_router
from src.commands.commandApi import router as command_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(cart_router)
app.include_router(conversations_router)
app.include_router(storico_router)
app.include_router(recording_router)
app.include_router(command_router)