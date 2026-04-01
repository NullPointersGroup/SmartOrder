from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, col
from pydantic import BaseModel
from src.db.models import Conversazioni

from src.db.dbConnection import get_conn
from src.auth.api import get_current_user

router = APIRouter(prefix="/conversations", tags=["conversations"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class ConversationOut(BaseModel):
    id_conv: int
    username: str
    titolo: str


class ConversationCreateRequest(BaseModel):
    titolo: str


class ConversationRenameRequest(BaseModel):
    titolo: str


# ── Dipendenze ───────────────────────────────────────────────────────────────

CurrentUser = Annotated[str, Depends(get_current_user)]
SessionDb   = Annotated[Session, Depends(get_conn)]


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/{username}")
def get_conversations(
    username: str,
    db: SessionDb,
    current_user: CurrentUser,
) -> List[ConversationOut]:
    """Restituisce tutte le conversazioni di un utente."""
    rows = db.exec(
        select(Conversazioni)
        .where(Conversazioni.username == username)
        .order_by(col(Conversazioni.id_conv).desc())
    ).all()
    return [
        ConversationOut(id_conv=r.id_conv, username=r.username, titolo=r.titolo)
        for r in rows
    ]


@router.post("/{username}", status_code=201)
def create_conversation(
    username: str,
    body: ConversationCreateRequest,
    db: SessionDb,
    current_user: CurrentUser,
) -> ConversationOut:
    """Crea una nuova Conversazioni per l'utente."""
    conv = Conversazioni(username=username, titolo=body.titolo)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return ConversationOut(id_conv=conv.id_conv, username=conv.username, titolo=conv.titolo)


@router.patch("/{conv_id}")
def rename_conversation(
    conv_id: int,
    body: ConversationRenameRequest,
    db: SessionDb,
    current_user: CurrentUser,
) -> ConversationOut:
    """Rinomina una Conversazioni esistente."""
    conv = db.get(Conversazioni, conv_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversazioni non trovata",
        )
    conv.titolo = body.titolo
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return ConversationOut(id_conv=conv.id_conv, username=conv.username, titolo=conv.titolo)


@router.delete("/{conv_id}", status_code=204)
def delete_conversation(
    conv_id: int,
    db: SessionDb,
    current_user: CurrentUser,
) -> None:
    """Elimina una Conversazioni e tutti i suoi messaggi (CASCADE)."""
    conv = db.get(Conversazioni, conv_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversazioni non trovata",
        )
    db.delete(conv)
    db.commit()
