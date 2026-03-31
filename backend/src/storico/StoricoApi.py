from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select

from src.db.dbConnection import get_conn
from src.auth.TokenUtility import TokenUtility
from src.storico.adapters.ConcreteGetOrdiniAdapter import ConcreteGetOrdiniAdapter
from src.storico.StoricoService import StoricoService
from src.storico.StoricoSchemas import StoricoResponseSchema
from src.storico.exceptions import OrdiniNotFoundException, StoricoAccessDeniedException
from src.db.models import Utente

router = APIRouter(prefix="/storico", tags=["Storico Ordini"])

_bearer = HTTPBearer()

DBSession = Annotated[Session, Depends(get_conn)]
Credentials = Annotated[HTTPAuthorizationCredentials, Depends(_bearer)]


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


@router.get("/cliente")
def get_storico_cliente(
    username: Username,
    service: ServiceDep,
) -> StoricoResponseSchema:
    try:
        return service.get_ordini_cliente(username)
    except OrdiniNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get("/admin")
def get_storico_admin(
    username: AdminUsername,
    service: ServiceDep,
) -> StoricoResponseSchema:
    try:
        return service.get_ordini_admin()
    except StoricoAccessDeniedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.message)