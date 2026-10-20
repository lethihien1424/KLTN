##D:\KLTN\KLTN\backend\src\main.py
import logging
from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Request,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from src.core.config import settings
from src.core.database import Base, engine, get_db
import src.models  # Registers all models in Base.metadata
from src.models.ly_do_model import LyDo, LyDoChucNang
from src.routes.api_router import api_router


logger = logging.getLogger("uvicorn.error")

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


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Lỗi máy chủ không xác định: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Lỗi máy chủ: {str(exc)}"},
    )


@app.on_event("startup")
def init_database_tables():
    """Đảm bảo bảng cơ sở dữ liệu và dữ liệu khởi tạo luôn sẵn sàng."""
    try:
        # 1. Tạo tất cả bảng nếu chưa tồn tại
        Base.metadata.create_all(bind=engine)

        # 2. Bổ sung các cột mới cho nhat_ky_hoat_dong nếu schema cũ chưa có
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    DO $$ BEGIN
                        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nhat_ky_hoat_dong') THEN
                            ALTER TABLE nhat_ky_hoat_dong
                                ADD COLUMN IF NOT EXISTS module VARCHAR(80),
                                ADD COLUMN IF NOT EXISTS chuc_nang VARCHAR(100),
                                ADD COLUMN IF NOT EXISTS ma_doi_tuong VARCHAR(100),
                                ADD COLUMN IF NOT EXISTS ten_nguoi_thao_tac VARCHAR(255),
                                ADD COLUMN IF NOT EXISTS du_lieu_truoc JSON,
                                ADD COLUMN IF NOT EXISTS du_lieu_sau JSON;
                        END IF;
                    END $$;
                    """
                )
            )

        # 3. Khởi tạo dữ liệu mẫu cho lý do nếu bảng ly_do trống
        with Session(engine) as db:
            count = db.query(LyDo).count()
            if count == 0:
                defaults = [
                    (
                        "LD0001",
                        "Không còn sử dụng",
                        [
                            "DOI_TRANG_THAI_NGUYEN_LIEU",
                            "DOI_TRANG_THAI_CONG_THUC",
                            "DOI_TRANG_THAI_NHA_CUNG_CAP",
                        ],
                    ),
                    (
                        "LD0002",
                        "Chất lượng không đạt",
                        [
                            "DOI_TRANG_THAI_NGUYEN_LIEU",
                            "DOI_TRANG_THAI_CONG_THUC",
                            "DOI_TRANG_THAI_NHA_CUNG_CAP",
                        ],
                    ),
                    (
                        "LD0003",
                        "Thay thế bằng danh mục mới",
                        [
                            "DOI_TRANG_THAI_NGUYEN_LIEU",
                            "DOI_TRANG_THAI_CONG_THUC",
                            "DOI_TRANG_THAI_NHA_CUNG_CAP",
                        ],
                    ),
                    (
                        "LD0004",
                        "Ngừng hợp tác",
                        [
                            "DOI_TRANG_THAI_NGUYEN_LIEU",
                            "DOI_TRANG_THAI_CONG_THUC",
                            "DOI_TRANG_THAI_NHA_CUNG_CAP",
                        ],
                    ),
                    (
                        "LD0005",
                        "Khôi phục sử dụng",
                        [
                            "DOI_TRANG_THAI_NGUYEN_LIEU",
                            "DOI_TRANG_THAI_CONG_THUC",
                            "DOI_TRANG_THAI_NHA_CUNG_CAP",
                        ],
                    ),
                    (
                        "LD0006",
                        "Khác",
                        [
                            "DOI_TRANG_THAI_NGUYEN_LIEU",
                            "DOI_TRANG_THAI_CONG_THUC",
                            "DOI_TRANG_THAI_NHA_CUNG_CAP",
                        ],
                    ),
                ]
                for code, name, funcs in defaults:
                    reason = LyDo(
                        id=code,
                        ma_ly_do=code,
                        ten_ly_do=name,
                        trang_thai="DANG_SU_DUNG",
                    )
                    db.add(reason)
                    db.flush()
                    for f in funcs:
                        db.add(
                            LyDoChucNang(
                                id=f"{code}_{f}",
                                ly_do_id=code,
                                chuc_nang=f,
                            )
                        )
                db.commit()
                logger.info("Đã khởi tạo danh mục lý do mặc định.")
    except Exception as exc:
        logger.warning(
            "Lỗi khi kiểm tra/khởi tạo bảng trên startup: %s",
            exc,
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
