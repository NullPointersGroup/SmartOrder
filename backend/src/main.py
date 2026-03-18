from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from src.auth.api import router as auth_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # URL del frontend Vite
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    errors = []
    for error in exc.errors():
        msg = error["msg"].replace("Value error, ", "")
        errors.append(msg)

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": {"ok": False, "errors": errors}}
    )