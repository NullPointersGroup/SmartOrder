from fastapi import FastAPI

from src.auth.api import router as auth_router

app = FastAPI()

app.include_router(auth_router)
