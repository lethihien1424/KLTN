from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from src.core.config import settings
from src.core.database import get_db
from src.routes.api_router import api_router


app = FastAPI(
    title=settings.WEBSITE_NAME,
    version="1.0.0",
    description=(
        "API hệ thống dự báo nhu cầu mua "
        "cà phê nguyên liệu Milano Coffee"
    ),
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router)


@app.get("/", tags=["System"])
def root():
    return {
        "message": "Milano Coffee API đang hoạt động",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


@app.get("/api/health", tags=["System"], include_in_schema=False)
@app.get(
    "/api/v1/health",
    tags=["System"],
)
def healthcheck(
    db: Session = Depends(get_db),
):
    try:
        db.execute(
            text("SELECT 1")
        )

        return {
            "status": "healthy",
            "database": "connected",
        }

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail="Không thể kết nối PostgreSQL.",
        ) from exc
