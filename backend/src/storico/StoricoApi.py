from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status, Cookie
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
from src.db.models import Utentiweb
from src.auth.api import get_current_user

Username = Annotated[str, Depends(get_current_user)]

router = APIRouter(prefix="/storico", tags=["Storico Ordini"])

DBSession = Annotated[Session, Depends(get_conn)]
Pagina = Annotated[int, Query(ge=1)]
PerPagina = Annotated[int, Query(ge=1, le=50)]


def _get_service(db: DBSession) -> StoricoService:
    adapter = ConcreteGetOrdiniAdapter(db)
    return StoricoService(adapter)


ServiceDep = Annotated[StoricoService, Depends(_get_service)]


def _require_admin(username: Username, db: DBSession) -> str:
    utente = db.exec(select(Utentiweb).where(Utentiweb.username == username)).first()
    if utente is None or not utente.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso riservato agli amministratori",
        )
    return username


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


@router.get("/tutti", dependencies=[Depends(_require_admin)])
def get_storico_admin(
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
) -> dict[str, str]:
    try:
        service.duplica_ordine(codice_ordine, username)
        return {"detail": "Ordine duplicato con successo"}
    except OrdineNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)