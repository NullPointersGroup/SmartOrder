from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.auth.api import router as auth_router
from src.chat.ChatApi import router as chat_router

app = FastAPI()

app.include_router(auth_router)
app.include_router(chat_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # URL del frontend Vite
    allow_methods=["*"],
    allow_headers=["*"],
)

