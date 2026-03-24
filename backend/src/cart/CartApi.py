from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from starlette.status import HTTP_404_NOT_FOUND

from backend.src.cart.CartSchemas import (
    AddProductRequest,
    CartProductResponse,
    CartResponse,
    RemoveProductRequest,
    UpdateProductRequest,
)
from backend.src.cart.CartService import CartService
from backend.src.cart.adapters.CartRepoAdapter import CartRepoAdapter
from backend.src.cart.adapters.CartRepository import CartRepository
from backend.src.cart.exceptions import (
    ProductNotFoundException,
    ProductNotInCartException,
)
from backend.src.db.dbConnection import get_conn

router = APIRouter(prefix="/cart", tags=["cart"])


def get_cart_service(db: Session = Depends(get_conn)) -> CartService:
    repo = CartRepoAdapter(CartRepository(db))
    return CartService(repo=repo)


CartServiceDep = Annotated[CartService, Depends(get_cart_service)]


@router.get("/{username}", response_model=CartResponse)
def get_user_cart(username: str, cart_service: CartServiceDep) -> CartResponse:
    res = cart_service.get_cart_products(username)
    return res


@router.post("/{username}", response_model=CartProductResponse)
def add_product_to_cart(
    username: str, request: AddProductRequest, cart_service: CartService
) -> CartProductResponse:
    try:
        return cart_service.add_product_to_cart(username, request.prod_id, request.qty)
    except ProductNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{username}", response_model=CartProductResponse)
def remove_product_from_cart(
    username: str, request: RemoveProductRequest, cart_service: CartServiceDep
) -> CartProductResponse:
    try:
        return cart_service.remove_product_from_cart(username, request.prod_id)
    except ProductNotInCartException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{username}", response_model=CartProductResponse)
def update_product_quantity(
    username: str, request: UpdateProductRequest, cart_service: CartServiceDep
) -> CartProductResponse:
    try:
        return cart_service.update_cart_quantity(
            username, request.prod_id, request.qty, request.operation
        )
    except ProductNotInCartException as e:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail=str(e))
