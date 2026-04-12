from typing import Annotated
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status, Cookie
from sqlmodel import Session, select

from src.db.dbConnection import get_conn
from src.history.adapters.GetOrdersAdapter import GetOrdersAdapter
from src.history.HistoryService import HistoryService
from src.history.HistorySchemas import HistoryPageSchema
from src.history.exceptions import (
    UserOrdersNotFoundException,
    OrderNotFoundException,
    HistoryAccessDeniedException,
)
from src.db.models import WebUser
from src.auth.api import get_current_user

Username = Annotated[str, Depends(get_current_user)]

router = APIRouter(prefix="/history", tags=["Storico Ordini"])

DBSession = Annotated[Session, Depends(get_conn)]
Page = Annotated[int, Query(ge=1)]
PerPage = Annotated[int, Query(ge=1, le=50)]


def get_service(db: DBSession) -> HistoryService:
    """
    @brief ritorna la classe Service
    @return la classe Service
    """
    adapter = GetOrdersAdapter(db)
    return HistoryService(adapter)


ServiceDep = Annotated[HistoryService, Depends(get_service)]


def require_admin(username: Username, db: DBSession) -> str:
    """
    @brief controlla se l'utente è un admin
    @raise HTTPException: accesso riservato agli amministratori
    @return se l'utente è un admin, ritorna lo username
    """
    utente = db.exec(select(WebUser).where(WebUser.username == username)).first()
    if utente is None or not utente.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso riservato agli amministratori",
        )
    return username


@router.get("/miei")
def get_history_customer(
    username: Username,
    service: ServiceDep,
    page: Page = 1,
    per_page: PerPage = 10,
    start_date: date | None = None,
    end_date: date | None = None,
) -> HistoryPageSchema:
    """
    @brief ritorna gli ordini di un cliente
    @raise HTTPException cliente npon trovato
    @return HistoryPageSchema: lista degli ordini, la pagina corrente e il totale delle pagine
    """
    try:
        return service.get_orders_customer(username, page, per_page, start_date, end_date)
    except UserOrdersNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get("/tutti", dependencies=[Depends(require_admin)])
def get_history_admin(
    service: ServiceDep,
    page: Page = 1,
    per_page: PerPage = 10,
    start_date: date | None = None,
    end_date: date | None = None,
) -> HistoryPageSchema:
    """
    @brief ritorna tutti gli ordini
    @raise HTTPException accesso non consentito
    @return HistoryPageSchema: lista degli ordini, la pagina corrente e il totale delle pagine
    """
    try:
        return service.get_orders_admin(page, per_page, start_date, end_date)
    except HistoryAccessDeniedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)


@router.post("/duplicate_order/{code_order}", status_code=status.HTTP_201_CREATED)
def duplicate_order(
    code_order: str,
    username: Username,
    service: ServiceDep,
) -> dict[str, str]:
    """
    @brief duplica un ordine
    @raise HTTPException 404 ordine non trovato
    @return il risultato dell'operazione
    """
    try:
        service.duplicate_order(code_order, username)
        return {"detail": "Ordine duplicato con successo"}
    except OrderNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
