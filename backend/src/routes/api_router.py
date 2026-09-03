##D:\KLTN\KLTN\backend\src\routes\api_router.py
from fastapi import APIRouter

from src.routes.auth_routes import router as auth_router


api_router = APIRouter(
    prefix="/api"
)

api_router.include_router(auth_router)