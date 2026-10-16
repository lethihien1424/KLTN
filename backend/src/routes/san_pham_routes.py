#### D:\KLTN\KLTN\backend\src\routes\san_pham_routes.py
from typing import Literal

from fastapi import (
    APIRouter,
    Depends,
    File,
    Query,
    Response,
    UploadFile,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.dependencies.permission_dependency import (
    require_any_permission,
    require_permission,
)
from src.models.san_pham_model import SanPham
from src.models.user_model import User
from src.schemas.import_schema import ImportResponse
from src.schemas.san_pham_schema import (
    SanPhamListResponse,
    SanPhamRequest,
    SanPhamResponse,
)
from src.services.data_processing.file_reader import (
    read_upload_file,
)
from src.services.san_pham_service import (
    SanPhamService,
)


router = APIRouter(
    prefix="/san-pham",
    tags=["Sản phẩm"],
)

EXCEL_MIME = (
    "application/vnd.openxmlformats-officedocument."
    "spreadsheetml.sheet"
)


@router.get(
    "/nhom",
    response_model=list[str],
)
def get_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_any_permission(
            ("san_pham", "XEM"),
            ("san_pham", "THEM"),
            ("san_pham", "SUA"),
        )
    ),
):
    return SanPhamService.groups(db)


@router.get("/template")
def get_template(
    current_user: User = Depends(
        require_permission(
            "san_pham",
            "NHAP_FILE",
        )
    ),
):
    return StreamingResponse(
        SanPhamService.excel([]),
        media_type=EXCEL_MIME,
        headers={
            "Content-Disposition": (
                'attachment; filename="'
                'Template_SanPham_Milano.xlsx"'
            ),
        },
    )


@router.get("/export")
def export_products(
    search: str | None = Query(
        None,
        max_length=150,
    ),
    nhom: str | None = Query(
        None,
        max_length=100,
    ),
    trang_thai: Literal[
        "DANG_KINH_DOANH",
        "NGUNG_BAN",
    ] | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(
            "san_pham",
            "XUAT_EXCEL",
        )
    ),
):
    rows = db.scalars(
        SanPhamService.statement(
            search,
            nhom,
            trang_thai,
        ).order_by(
            SanPham.ma_san_pham
        )
    ).all()

    return StreamingResponse(
        SanPhamService.excel(rows),
        media_type=EXCEL_MIME,
        headers={
            "Content-Disposition": (
                'attachment; filename="'
                'SanPham_Milano.xlsx"'
            ),
        },
    )


@router.post(
    "/import",
    response_model=ImportResponse,
)
async def import_products(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(
            "san_pham",
            "NHAP_FILE",
        )
    ),
):
    try:
        dataframe, _ = await read_upload_file(
            file
        )

        return SanPhamService.import_rows(
            db,
            dataframe,
        )
    finally:
        await file.close()


@router.get(
    "",
    response_model=SanPhamListResponse,
)
def get_products(
    search: str | None = Query(
        None,
        max_length=150,
    ),
    nhom: str | None = Query(
        None,
        max_length=100,
    ),
    trang_thai: Literal[
        "DANG_KINH_DOANH",
        "NGUNG_BAN",
    ] | None = None,
    page: int = Query(
        1,
        ge=1,
    ),
    page_size: int = Query(
        10,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(
            "san_pham",
            "XEM",
        )
    ),
):
    return SanPhamService.get_list(
        db,
        search,
        nhom,
        trang_thai,
        page,
        page_size,
    )


@router.get(
    "/{ma}",
    response_model=SanPhamResponse,
)
def get_product(
    ma: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(
            "san_pham",
            "XEM",
        )
    ),
):
    return SanPhamService.get_one(
        db,
        ma,
    )


@router.post(
    "",
    response_model=SanPhamResponse,
    status_code=201,
)
def create_product(
    payload: SanPhamRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(
            "san_pham",
            "THEM",
        )
    ),
):
    return SanPhamService.save(
        db,
        payload,
    )


@router.put(
    "/{ma}",
    response_model=SanPhamResponse,
)
def update_product(
    ma: str,
    payload: SanPhamRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(
            "san_pham",
            "SUA",
        )
    ),
):
    return SanPhamService.save(
        db,
        payload,
        ma,
    )


@router.delete(
    "/{ma}",
    status_code=204,
)
def delete_product(
    ma: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(
            "san_pham",
            "XOA",
        )
    ),
):
    SanPhamService.delete(
        db,
        ma,
    )

    return Response(status_code=204)