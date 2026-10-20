## D:\KLTN\KLTN\backend\src\routes\ly_do_routes.py
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.dependencies.permission_dependency import (
    require_permission,
    require_any_permission,
)
from src.models.ly_do_model import LyDo, LyDoChucNang
from src.models.user_model import User
from src.schemas.ly_do_schema import (
    ReasonWrite,
    ReasonStatusWrite,
    FunctionCode,
)
from src.services.ly_do_service import reason_response, write_reason


router = APIRouter(tags=["Cấu hình lý do"])


@router.get("/ly-do")
def reasons(
    search: str = "",
    chuc_nang: str | None = None,
    trang_thai: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(
        require_permission("quan_ly_ly_do", "XEM")
    ),
):
    query = select(LyDo)

    if search and search.strip():
        term = (
            search.strip()
            .replace("/", "//")
            .replace("%", "/%")
            .replace("_", "/_")
        )
        query = query.where(
            LyDo.ten_ly_do.ilike(
                "%" + term + "%",
                escape="/",
            )
        )

    if trang_thai and trang_thai.strip():
        query = query.where(
            LyDo.trang_thai == trang_thai.strip()
        )

    if chuc_nang and chuc_nang.strip():
        query = query.where(
            LyDo.id.in_(
                select(LyDoChucNang.ly_do_id).where(
                    LyDoChucNang.chuc_nang
                    == chuc_nang.strip()
                )
            )
        )

    total = db.scalar(
        select(func.count()).select_from(query.subquery())
    ) or 0

    rows = db.scalars(
        query.order_by(
            LyDo.created_at.desc(),
            LyDo.id,
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return {
        "items": [reason_response(db, row) for row in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/ly-do/ap-dung")
def applicable(
    chuc_nang: FunctionCode,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_any_permission(
            ("nguyen_lieu", "SUA"),
            ("cong_thuc", "XAC_NHAN"),
            ("nha_cung_cap", "XAC_NHAN"),
        )
    ),
):
    from src.services.phan_quyen_service import PhanQuyenService

    selected = {
        (item.chuc_nang, item.thao_tac)
        for item in PhanQuyenService().get_my_permissions(
            db=db,
            current_user=user,
        ).chi_tiet
    }

    required = {
        "DOI_TRANG_THAI_NGUYEN_LIEU": (
            "nguyen_lieu",
            "SUA",
        ),
        "DOI_TRANG_THAI_CONG_THUC": (
            "cong_thuc",
            "XAC_NHAN",
        ),
        "DOI_TRANG_THAI_NHA_CUNG_CAP": (
            "nha_cung_cap",
            "XAC_NHAN",
        ),
    }[chuc_nang]

    if required not in selected:
        raise HTTPException(
            status_code=403,
            detail=(
                "Bạn chưa được cấp quyền đổi trạng thái "
                "chức năng này."
            ),
        )

    rows = db.scalars(
        select(LyDo)
        .join(
            LyDoChucNang,
            LyDo.id == LyDoChucNang.ly_do_id,
        )
        .where(
            LyDo.trang_thai == "DANG_SU_DUNG",
            LyDoChucNang.chuc_nang == chuc_nang,
        )
        .order_by(LyDo.ten_ly_do)
    )

    return [reason_response(db, row) for row in rows]


@router.post("/ly-do", status_code=201)
def create(
    payload: ReasonWrite,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_permission("quan_ly_ly_do", "THEM")
    ),
):
    return write_reason(
        db,
        payload,
        user.ma_nguoi_dung,
    )


@router.put("/ly-do/{code}")
def update(
    code: str,
    payload: ReasonWrite,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_permission("quan_ly_ly_do", "SUA")
    ),
):
    from src.services.phan_quyen_service import PhanQuyenService

    selected = {
        (item.chuc_nang, item.thao_tac)
        for item in PhanQuyenService().get_my_permissions(
            db=db,
            current_user=user,
        ).chi_tiet
    }

    model = db.get(LyDo, code)

    if model and model.trang_thai != payload.trang_thai:
        if ("quan_ly_ly_do", "XAC_NHAN") not in selected:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Bạn chưa được cấp quyền "
                    "đổi trạng thái lý do."
                ),
            )

    return write_reason(
        db,
        payload,
        user.ma_nguoi_dung,
        code,
        ("quan_ly_ly_do", "XAC_NHAN") in selected,
    )


@router.patch("/ly-do/{code}/trang-thai")
def change_status(
    code: str,
    payload: ReasonStatusWrite,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_permission("quan_ly_ly_do", "XAC_NHAN")
    ),
):
    model = db.scalar(
        select(LyDo)
        .where(LyDo.id == code)
        .with_for_update()
    )

    if model is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lý do.",
        )

    model.trang_thai = payload.trang_thai
    model.updated_at = datetime.now(timezone.utc)
    model.updated_by = user.ma_nguoi_dung

    db.flush()
    result = reason_response(db, model)
    db.commit()

    return result


@router.get("/nhat-ky-hoat-dong")
def audit(
    search: str = "",
    module: str = "",
    hanh_dong: str = "",
    nguoi_thao_tac: str = "",
    tu_ngay: date | None = None,
    den_ngay: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(
        require_permission("nhat_ky_hoat_dong", "XEM")
    ),
):
    from src.services.audit_query import list_audit

    return list_audit(
        db,
        search,
        module,
        hanh_dong,
        nguoi_thao_tac,
        tu_ngay,
        den_ngay,
        page,
        page_size,
    )


HISTORY_SCOPES = {
    "nguyen-lieu": (
        ("nguyen_lieu", "XEM"),
        ("Nguyên liệu",),
    ),
    "nha-cung-cap": (
        ("nha_cung_cap", "XEM"),
        ("Nhà cung cấp",),
    ),
    "cong-thuc": (
        ("cong_thuc", "XEM"),
        ("Công thức / BOM", "Chi tiết công thức"),
    ),
    "ton-kho-nguyen-lieu": (
        ("ton_kho_nguyen_lieu", "XEM"),
        ("Tồn kho nguyên liệu",),
    ),
    "nguyen-lieu-nha-cung-cap": (
        ("nguyen_lieu_nha_cung_cap", "XEM"),
        ("Nguyên liệu cung ứng",),
    ),
    "de-xuat-nhap-hang": (
        ("de_xuat_nhap_hang", "XEM"),
        ("Đề xuất nhập hàng", "Chi tiết đề xuất"),
    ),
    "don-mua-nguyen-lieu": (
        ("don_mua_nguyen_lieu", "XEM"),
        ("Đơn mua nguyên liệu", "Chi tiết đơn mua"),
    ),
}


@router.get(
    "/nhat-ky-hoat-dong/doi-tuong/{entity}/{code:path}"
)
def object_history(
    entity: str,
    code: str,
    search: str = "",
    module: str = "",
    hanh_dong: str = "",
    nguoi_thao_tac: str = "",
    tu_ngay: date | None = None,
    den_ngay: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(
        require_any_permission(
            ("nguyen_lieu", "XEM"),
            ("nha_cung_cap", "XEM"),
            ("cong_thuc", "XEM"),
            ("ton_kho_nguyen_lieu", "XEM"),
            ("nguyen_lieu_nha_cung_cap", "XEM"),
            ("de_xuat_nhap_hang", "XEM"),
            ("don_mua_nguyen_lieu", "XEM"),
        )
    ),
):
    from src.services.phan_quyen_service import PhanQuyenService
    from src.services.audit_query import list_audit

    scope = HISTORY_SCOPES.get(entity)

    if not scope:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy chức năng lịch sử.",
        )

    permission, functions = scope

    selected = {
        (item.chuc_nang, item.thao_tac)
        for item in PhanQuyenService().get_my_permissions(
            db=db,
            current_user=user,
        ).chi_tiet
    }

    if permission not in selected:
        raise HTTPException(
            status_code=403,
            detail=(
                "Bạn chưa được cấp quyền "
                "xem lịch sử đối tượng này."
            ),
        )

    return list_audit(
        db,
        search,
        module,
        hanh_dong,
        nguoi_thao_tac,
        tu_ngay,
        den_ngay,
        page,
        page_size,
        (functions, code),
    )