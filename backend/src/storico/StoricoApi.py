from typing import Annotated
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status, Cookie
from sqlmodel import Session, select

from src.db.dbConnection import get_conn
from src.storico.adapters.GetOrdiniAdapter import GetOrdiniAdapter
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


def get_service(db: DBSession) -> StoricoService:
    """
    @brief ritorna la classe Service
    @return la classe Service
    """
    adapter = GetOrdiniAdapter(db)
    return StoricoService(adapter)


ServiceDep = Annotated[StoricoService, Depends(get_service)]


def require_admin(username: Username, db: DBSession) -> str:
    """
    @brief controlla se l'utente è un admin
    @raise HTTPException: accesso riservato agli amministratori
    @return se l'utente è un admin, ritorna lo username
    """
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
    data_inizio: date | None = None,
    data_fine: date | None = None,
) -> StoricoPageSchema:
    """
    @brief ritorna gli ordini di un cliente
    @raise HTTPException cliente npon trovato
    @return StoricoPageSchema: lista degli ordini, la pagina corrente e il totale delle pagine
    """
    try:
        return service.get_ordini_cliente(username, pagina, per_pagina, data_inizio, data_fine)
    except OrdiniNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get("/tutti", dependencies=[Depends(require_admin)])
def get_storico_admin(
    service: ServiceDep,
    pagina: Pagina = 1,
    per_pagina: PerPagina = 10,
    data_inizio: date | None = None,
    data_fine: date | None = None,
) -> StoricoPageSchema:
    """
    @brief ritorna tutti gli ordini
    @raise HTTPException accesso non consentito
    @return StoricoPageSchema: lista degli ordini, la pagina corrente e il totale delle pagine
    """
    try:
        return service.get_ordini_admin(pagina, per_pagina, data_inizio, data_fine)
    except StoricoAccessDeniedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)


@router.post("/duplica/{codice_ordine}", status_code=status.HTTP_201_CREATED)
def duplica_ordine(
    codice_ordine: str,
    username: Username,
    service: ServiceDep,
) -> dict[str, str]:
    """
    @brief duplica un ordine
    @raise HTTPException 404 ordine non trovato
    @return il risultato dell'operazione
    """
    try:
        service.duplica_ordine(codice_ordine, username)
        return {"detail": "Ordine duplicato con successo"}
    except OrdineNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)