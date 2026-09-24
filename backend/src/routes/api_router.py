from fastapi import APIRouter

from src.routes.auth_routes import (
    router as auth_router,
)
from src.routes.du_bao_routes import (
    router as du_bao_router,
)
from src.routes.import_routes import (
    router as import_router,
)


api_router = APIRouter(
    prefix="/api",
)


api_router.include_router(
    auth_router
)

api_router.include_router(
    import_router
)

api_router.include_router(
    du_bao_router
)