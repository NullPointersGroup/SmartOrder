from fastapi import APIRouter
from src.commands.ConcreteCommands import (
    DuplicaComand, DuplicaXXComand, CarrelloComand,
    InviaComand, AnnullaComand, ComandiComand, ScimmiaComand
)

from src.db.dbConnection import get_conn
from src.auth.api import get_current_user

router = APIRouter(prefix="/commands", tags=["Comandi"])

# ── Endpoint ──────────────────────────────────────────────────────────────────

COMMANDS = [
    DuplicaComand(),
    DuplicaXXComand(),
    CarrelloComand(),
    InviaComand(),
    AnnullaComand(),
    ComandiComand(),
    ScimmiaComand(),
]

@router.get("/retrieve")
def retrieve_commands():
    return [{"name": c.name} for c in COMMANDS]