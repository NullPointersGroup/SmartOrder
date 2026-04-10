from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Cookie
from sqlmodel import Session

from src.cart.CartSchemas import (
    CartResponse,
)
from src.cart.CartService import CartService
from src.cart.adapters.CartRepoAdapter import CartRepoAdapter
from src.cart.adapters.CartRepository import CartRepository
from src.db.dbConnection import get_conn
from src.auth.api import decode_token

router = APIRouter(prefix="/cart", tags=["cart"])


def get_current_user(access_token: str | None = Cookie(default=None)) -> str:
    """
    @brief Estrae e valida il token JWT dal cookie access_token
    @param access_token Token JWT dal cookie
    @return Username decodificato dal token
    @throws HTTPException 401 se token assente o non valido
    """
    if access_token is None:
        raise HTTPException(status_code=401, detail="Non autenticato")
    username = decode_token(access_token)
    if username is None:
        raise HTTPException(status_code=401, detail="Token non valido")
    return str(username)


CurrentUserDep = Annotated[str, Depends(get_current_user)]


def get_cart_service(db: Session = Depends(get_conn)) -> CartService:
    """
    @brief Crea e restituisce un'istanza di CartService con le dipendenze necessarie
    @param db Sessione del database
    @return CartService configurato
    """
    adapter = CartRepoAdapter(CartRepository(db))
    return CartService(adapter=adapter)


CartServiceDep = Annotated[CartService, Depends(get_cart_service)]


@router.get("/{username}")
def get_user_cart(username: str, cart_service: CartServiceDep) -> CartResponse:
    """
    @brief Recupera tutti i prodotti nel carrello di un utente
    @param username Nome dell'utente
    @param cart_service Servizio carrello iniettato
    @return CartResponse con lista prodotti e username
    """
    products = cart_service.get_cart_products(username)
    return CartResponse(products=products, username=username)


@router.post("/{username}/sendOrder", status_code=204, responses={401: {}})
def send_order(
    username: str,
    cart_service: CartServiceDep,
    current_user: CurrentUserDep,
) -> None:
    if current_user != username:
        raise HTTPException(status_code=401, detail="Non autorizzato")
    return cart_service.send_order(username)

