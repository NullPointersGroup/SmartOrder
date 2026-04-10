import os
os.environ.setdefault("SECRET_KEY", "test-secret-key")

import sys
import types
from unittest.mock import MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

if "slowapi" not in sys.modules:
    slowapi_module = types.ModuleType("slowapi")
    slowapi_errors = types.ModuleType("slowapi.errors")
    slowapi_util = types.ModuleType("slowapi.util")

    class DummyLimiter:
        def __init__(self, *args, **kwargs):
            pass

        def limit(self, *args, **kwargs):
            def decorator(func):
                return func

            return decorator

    class RateLimitExceeded(Exception):
        pass

    slowapi_module.Limiter = DummyLimiter
    slowapi_module._rate_limit_exceeded_handler = lambda *args, **kwargs: None
    slowapi_errors.RateLimitExceeded = RateLimitExceeded
    slowapi_util.get_remote_address = lambda request: "test"

    sys.modules["slowapi"] = slowapi_module
    sys.modules["slowapi.errors"] = slowapi_errors
    sys.modules["slowapi.util"] = slowapi_util

from src.auth.api import (
    router as auth_router,
    get_check_user_service,
    get_register_user_service,
    get_reset_password_service,
    get_delete_user_service,
    get_current_user
)
from src.auth.schemas import UserSchema, UserRegistrationSchema
from src.db.models import Utentiweb 
from src.auth.limiter import limiter
from src.auth.CheckUserService import CheckUserService
from src.auth.RegisterUserService import RegisterUserService
from src.auth.DeleteUserService import DeleteUserService
from src.auth.ResetPasswordService import ResetPasswordService


@pytest.fixture
def mock_user() -> UserSchema:
    return UserSchema(username="testuser", password="testpassword")


@pytest.fixture
def mock_user_registration() -> UserRegistrationSchema:
    return UserRegistrationSchema(
        username="testuser",
        password="Password1!",
        email="test@test.com",
        confirmPwd="Password1!",
    )


@pytest.fixture
def mock_session(mock_utente: Utentiweb) -> MagicMock:
    session = MagicMock()
    session.exec.return_value.all.return_value = [mock_utente]
    return session


@pytest.fixture
def mock_check_service():
    return MagicMock(spec=CheckUserService)

@pytest.fixture
def mock_register_service():
    return MagicMock(spec=RegisterUserService)

@pytest.fixture
def mock_delete_service():
    return MagicMock(spec=DeleteUserService)

@pytest.fixture
def mock_reset_service():
    return MagicMock(spec=ResetPasswordService)


@pytest.fixture
def client(
    mock_check_service,
    mock_register_service,
    mock_delete_service,
    mock_reset_service,
):
    app = FastAPI()
    app.include_router(auth_router, prefix="/api")
    app.state.limiter = limiter

    app.dependency_overrides[get_check_user_service] = lambda: mock_check_service
    app.dependency_overrides[get_register_user_service] = lambda: mock_register_service
    app.dependency_overrides[get_delete_user_service] = lambda: mock_delete_service
    app.dependency_overrides[get_reset_password_service] = lambda: mock_reset_service

    app.dependency_overrides[get_current_user] = lambda: "testuser"

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
