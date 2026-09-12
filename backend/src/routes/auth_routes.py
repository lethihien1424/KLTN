from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.orm import Session

from src.controllers.auth_controller import (
    AuthController,
)
from src.core.database import get_db
from src.dependencies.auth_dependency import (
    get_current_user,
)
from src.models.user_model import User
from src.schemas.auth_schema import (
    LoginRequest,
    LogoutResponse,
    MeResponse,
    TokenResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    return AuthController.login(
        payload=payload,
        db=db,
    )


@router.get(
    "/me",
    response_model=MeResponse,
)
def me(
    current_user: User = Depends(
        get_current_user
    ),
):
    return AuthController.me(
        current_user=current_user
    )


@router.post(
    "/logout",
    response_model=LogoutResponse,
)
def logout(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return AuthController.logout(
        current_user=current_user,
        db=db,
    )