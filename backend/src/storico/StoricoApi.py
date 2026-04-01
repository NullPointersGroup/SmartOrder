from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select

from src.db.dbConnection import get_conn
from src.auth.TokenUtility import TokenUtility
from src.storico.adapters.ConcreteGetOrdiniAdapter import ConcreteGetOrdiniAdapter
from src.storico.StoricoService import StoricoService
from src.storico.StoricoSchemas import StoricoPageSchema
from src.storico.exceptions import (
    OrdiniNotFoundException,
    OrdineNotFoundException,
    StoricoAccessDeniedException,
)
from src.db.models import Utente

router = APIRouter(prefix="/storico", tags=["Storico Ordini"])

_bearer = HTTPBearer()

DBSession = Annotated[Session, Depends(get_conn)]
Credentials = Annotated[HTTPAuthorizationCredentials, Depends(_bearer)]
Pagina = Annotated[int, Query(ge=1)]
PerPagina = Annotated[int, Query(ge=1, le=50)]


def _get_username(credentials: Credentials) -> str:
    username = TokenUtility.decode_token(credentials.credentials)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido o scaduto",
        )
    return username


Username = Annotated[str, Depends(_get_username)]


def _get_service(db: DBSession) -> StoricoService:
    adapter = ConcreteGetOrdiniAdapter(db)
    return StoricoService(adapter)


ServiceDep = Annotated[StoricoService, Depends(_get_service)]


def _require_admin(username: Username, db: DBSession) -> str:
    utente = db.exec(select(Utente).where(Utente.username == username)).first()
    if utente is None or not utente.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso riservato agli amministratori",
        )
    return username


AdminUsername = Annotated[str, Depends(_require_admin)]


@router.get("/miei")
def get_storico_cliente(
    username: Username,
    service: ServiceDep,
    pagina: Pagina = 1,
    per_pagina: PerPagina = 10,
) -> StoricoPageSchema:
    try:
        return service.get_ordini_cliente(username, pagina, per_pagina)
    except OrdiniNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get("/tutti")
def get_storico_admin(
    username: AdminUsername,
    service: ServiceDep,
    pagina: Pagina = 1,
    per_pagina: PerPagina = 10,
) -> StoricoPageSchema:
    try:
        return service.get_ordini_admin(pagina, per_pagina)
    except StoricoAccessDeniedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)


@router.post("/duplica/{codice_ordine}", status_code=status.HTTP_201_CREATED)
def duplica_ordine(
    codice_ordine: str,
    username: Username,
    service: ServiceDep,
) -> dict:
    try:
        service.duplica_ordine(codice_ordine, username)
        return {"detail": "Ordine duplicato con successo"}
    except OrdineNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)