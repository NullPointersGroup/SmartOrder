from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Cookie
from sqlmodel import Session
from starlette.status import HTTP_404_NOT_FOUND

from src.cart.CartSchemas import (
    AddProductRequest,
    CartProductResponse,
    CartResponse,
    RemoveProductRequest,
    UpdateProductRequest,
)
from src.cart.CartService import CartService
from src.cart.adapters.CartRepoAdapter import CartRepoAdapter
from src.cart.adapters.CartRepository import CartRepository
from src.cart.exceptions import (
    ProductNotFoundException,
    ProductNotInCartException,
)
from src.db.dbConnection import get_conn
from src.auth.TokenUtility import TokenUtility
from src.auth.UserService import UserService
from src.auth.UserRepoAdapter import UserRepoAdapter
from src.auth.EmailValidationAdapter import EmailValidationAdapter

router = APIRouter(prefix="/cart", tags=["cart"])

def get_user_service(db: Session = Depends(get_conn)) -> UserService:
    """
    @brief Crea e restituisce un'istanza di UserService con le dipendenze necessarie
    @param db Sessione del database
    @return UserService configurato
    """
    return UserService(
        repo=UserRepoAdapter(db),
        email_validator=EmailValidationAdapter(),
    )

UserServiceDep = Annotated[UserService, Depends(get_user_service)]

def get_current_user(access_token: str | None = Cookie(default=None)) -> str:
    """
    @brief Estrae e valida il token JWT dal cookie access_token
    @param access_token Token JWT dal cookie
    @return Username decodificato dal token
    @throws HTTPException 401 se token assente o non valido
    """
    if access_token is None:
        raise HTTPException(status_code=401, detail="Non autenticato")
    username = TokenUtility.decode_token(access_token)
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


@router.post("/{username}")
def add_product_to_cart(
    username: str, request: AddProductRequest, cart_service: CartServiceDep
) -> CartProductResponse:
    """
    @brief Aggiunge un prodotto al carrello dell'utente
    @param username Nome dell'utente
    @param request Richiesta con prod_id e quantità
    @param cart_service Servizio carrello iniettato
    @return CartProductResponse con prodotto aggiunto e username
    @throws HTTPException 404 se prodotto non trovato
    """
    try:
        product = cart_service.add_product_to_cart(
            username, request.prod_id, request.qty
        )
        return CartProductResponse(product=product, username=username)
    except ProductNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{username}")
def remove_product_from_cart(
    username: str, request: RemoveProductRequest, cart_service: CartServiceDep
) -> CartProductResponse:
    """
    @brief Rimuove un prodotto dal carrello dell'utente
    @param username Nome dell'utente
    @param request Richiesta con prod_id da rimuovere
    @param cart_service Servizio carrello iniettato
    @return CartProductResponse con prodotto rimosso e username
    @throws HTTPException 404 se prodotto non presente nel carrello
    """
    try:
        product = cart_service.remove_product_from_cart(username, request.prod_id)
        return CartProductResponse(product=product, username=username)
    except ProductNotInCartException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{username}")
def update_product_quantity(
    username: str, request: UpdateProductRequest, cart_service: CartServiceDep
) -> CartProductResponse:
    """
    @brief Aggiorna la quantità di un prodotto nel carrello
    @param username Nome dell'utente
    @param request Richiesta con prod_id, qty e operation (increase/decrease/set)
    @param cart_service Servizio carrello iniettato
    @return CartProductResponse con prodotto aggiornato e username
    @throws HTTPException 404 se prodotto non presente nel carrello
    """
    try:
        product = cart_service.update_cart_quantity(
            username, request.prod_id, request.qty, request.operation
        )
        return CartProductResponse(product=product, username=username)
    except ProductNotInCartException as e:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail=str(e))
    
@router.post(
    "/{username}/sendOrder",
    status_code=204,
    responses={
        401: {}
    }    
)
def send_order(
    username: str,
    cart_service: CartServiceDep,
    current_user: CurrentUserDep,
) -> None:
    if current_user != username:
        raise HTTPException(status_code=401, detail="Non autorizzato")
    return cart_service.send_order(username)