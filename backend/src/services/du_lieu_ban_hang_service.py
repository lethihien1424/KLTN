###D:\KLTN\KLTN\backend\src\services\du_lieu_ban_hang_service.py
import logging
from decimal import Decimal, ROUND_HALF_UP
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
from src.models.ke_hoach_san_xuat_model import KeHoachSanXuat
from src.models.lich_su_tieu_thu_model import LichSuTieuThu
from src.repositories.du_lieu_ban_hang_repository import (
    DuLieuBanHangRepository,
)
from src.schemas.du_lieu_ban_hang_schema import (
    DanhMucBanHangResponse,
    DuLieuBanHangCreateRequest,
    DuLieuBanHangCreateResponse,
    NgayLeBanHangOption,
    SanPhamBanHangOption,
)
logger = logging.getLogger(__name__)
class DuLieuBanHangService:
    def __init__(self) -> None:
        self.repository = DuLieuBanHangRepository()
    def get_catalog(
        self,
        db: Session,
    ) -> DanhMucBanHangResponse:
        return DanhMucBanHangResponse(
            san_pham=[
                SanPhamBanHangOption(
                    ma=row.ma_san_pham,
                    ten=row.ten_san_pham,
                    don_gia=row.don_gia,
                    don_vi_tien_te=row.don_vi_tien_te,
                )
                for row in self.repository.get_products(db)
            ],
            ngay_le=[
                NgayLeBanHangOption(
                    ma=row.ma_ngay_le,
                    ten=row.ten_ngay_le,
                )
                for row in self.repository.get_holidays(db)
            ],
        )
    @staticmethod
    def _response(
        model: LichSuTieuThu,
        product_name: str,
    ) -> DuLieuBanHangCreateResponse:
        price = model.gia_ban_sau_giam
        if price is None and model.gia_goc is not None:
            price = (
                model.gia_goc
                * (Decimal("1") - model.muc_giam_gia)
            ).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP,
            )
        total = None
        if price is not None:
            total = (
                price * model.so_luong_ban
            ).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP,
            )
        return DuLieuBanHangCreateResponse(
            ma=model.ma_lich_su,
            bang_luu="lich_su_tieu_thu",
            ma_don_hang=model.ma_don_hang,
            ma_san_pham=model.ma_san_pham,
            ten_san_pham=product_name,
            ngay_ban=model.ngay_ban,
            ngay_giao_hang=model.ngay_giao_hang,
            so_luong=model.so_luong_ban,
            trang_thai_don_hang=model.trang_thai_don_hang,
            trang_thai_san_xuat=model.trang_thai_san_xuat,
            gia_goc=model.gia_goc,
            muc_giam_gia=model.muc_giam_gia,
            gia_ban_sau_giam=price,
            thanh_tien=total,
            co_khuyen_mai=model.co_khuyen_mai,
            chuong_trinh_km=model.chuong_trinh_km,
            ma_ctkm=model.ma_ctkm,
            kenh_ban_hang=model.kenh_ban_hang,
            ma_ngay_le=model.ma_ngay_le,
        )
    def create(
        self,
        db: Session,
        payload: DuLieuBanHangCreateRequest,
    ) -> DuLieuBanHangCreateResponse:
        if payload.trang_thai_don_hang != "CHO_GIAO_HANG":
            raise HTTPException(
                status_code=400,
                detail="Thêm mới chỉ tạo đơn chờ giao.",
            )
        return self._save(db, payload, ma=None)
    def update(
        self,
        db: Session,
        ma: str,
        payload: DuLieuBanHangCreateRequest,
    ) -> DuLieuBanHangCreateResponse:
        return self._save(db, payload, ma=ma)
    def _save(
        self,
        db: Session,
        payload: DuLieuBanHangCreateRequest,
        ma: str | None,
    ) -> DuLieuBanHangCreateResponse:
        try:
            response = self.save_in_transaction(
                db=db,
                payload=payload,
                ma=ma,
                use_product_price=True,
            )
            db.commit()
            return response
        except HTTPException:
            db.rollback()
            raise
        except ValidationError as exc:
            db.rollback()
            raise HTTPException(
                status_code=422,
                detail="; ".join(
                    item["msg"]
                    for item in exc.errors()
                ),
            ) from exc
        except IntegrityError as exc:
            db.rollback()
            sqlstate = (
                getattr(exc.orig, "pgcode", None)
                or getattr(exc.orig, "sqlstate", None)
            )
            raise HTTPException(
                status_code=409 if sqlstate == "23505" else 400,
                detail=(
                    "Mã đơn và sản phẩm đã tồn tại."
                    if sqlstate == "23505"
                    else "Dữ liệu không đáp ứng ràng buộc DB."
                ),
            ) from exc
        except SQLAlchemyError as exc:
            db.rollback()
            logger.exception("Không thể lưu dữ liệu bán hàng.")
            raise HTTPException(
                status_code=500,
                detail="Không thể lưu đơn hàng lúc này.",
            ) from exc
        except Exception:
            db.rollback()
            raise
    def _validate_ctkm(
        self,
        db: Session,
        payload: DuLieuBanHangCreateRequest,
    ) -> None:
        if payload.ma_ctkm is None:
            return
        if not payload.co_khuyen_mai:
            raise HTTPException(
                status_code=400,
                detail="Đơn có mã CTKM phải bật khuyến mãi.",
            )
        ctkm = self.repository.get_ctkm(
            db,
            payload.ma_ctkm,
        )
        if ctkm is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Mã CTKM '{payload.ma_ctkm}' "
                    "không tồn tại trong database."
                ),
            )
        if ctkm.trang_thai == "HUY":
            raise HTTPException(
                status_code=400,
                detail="Không được áp dụng CTKM đã hủy.",
            )
        if not self.repository.ctkm_applies_to_product(
            db,
            payload.ma_ctkm,
            payload.ma_san_pham,
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"CTKM {payload.ma_ctkm} không áp dụng "
                    f"cho sản phẩm {payload.ma_san_pham}."
                ),
            )
        if not (
            ctkm.ngay_bat_dau
            <= payload.ngay_ban
            <= ctkm.ngay_ket_thuc
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Ngày bán không thuộc thời gian "
                    f"áp dụng CTKM {payload.ma_ctkm}."
                ),
            )
        if payload.so_luong != ctkm.so_luong_dat_quy_dinh:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"CTKM {payload.ma_ctkm} yêu cầu "
                    f"số lượng đúng bằng "
                    f"{ctkm.so_luong_dat_quy_dinh}."
                ),
            )
        expected_discount = (
            Decimal(str(ctkm.muc_giam_phan_tram))
            / Decimal("100")
        )
        if abs(
            payload.muc_giam_gia - expected_discount
        ) > Decimal("0.0001"):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Mức giảm của CTKM {payload.ma_ctkm} "
                    f"phải là {ctkm.muc_giam_phan_tram}%."
                ),
            )
        if (
            payload.chuong_trinh_km is not None
            and payload.chuong_trinh_km != ctkm.ten_ctkm
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Tên chương trình khuyến mãi không "
                    "khớp với mã CTKM."
                ),
            )
    def save_in_transaction(
        self,
        db: Session,
        payload: DuLieuBanHangCreateRequest,
        ma: str | None = None,
        use_product_price: bool = False,
    ) -> DuLieuBanHangCreateResponse:
        model = None
        plan = None
        if ma is not None:
            model = self.repository.get_order(db, ma)
            if model is None:
                raise HTTPException(
                    status_code=404,
                    detail="Không tìm thấy đơn hàng.",
                )
            if model.trang_thai_don_hang != "CHO_GIAO_HANG":
                raise HTTPException(
                    status_code=409,
                    detail="Đơn đã giao chỉ được xem.",
                )
            if model.ma_ke_hoach_nguon is not None:
                plan = self.repository.get_plan(
                    db,
                    model.ma_ke_hoach_nguon,
                )
                if plan is None:
                    raise HTTPException(
                        status_code=409,
                        detail="Không tìm thấy KHSX liên kết với đơn.",
                    )
            else:
                plan = self.repository.plan_for_pair(
                    db,
                    model.ma_don_hang,
                    model.ma_san_pham,
                )
            if (
                plan is not None
                and plan.trang_thai_san_xuat != "CHO_SAN_XUAT"
            ):
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Kế hoạch đã bắt đầu hoặc hoàn tất sản xuất. "
                        "Không sửa đơn bằng chức năng này."
                    ),
                )
        product = self.repository.get_product(
            db,
            payload.ma_san_pham,
        )
        if product is None:
            raise HTTPException(
                status_code=400,
                detail="Sản phẩm không tồn tại.",
            )
        if (
            payload.ma_ngay_le is not None
            and not self.repository.holiday_exists(
                db,
                payload.ma_ngay_le,
            )
        ):
            raise HTTPException(
                status_code=400,
                detail="Ngày lễ không tồn tại.",
            )
        if self.repository.order_exists(
            db,
            payload.ma_don_hang,
            payload.ma_san_pham,
            exclude_id=ma,
        ):
            raise HTTPException(
                status_code=409,
                detail="Mã đơn và sản phẩm đã tồn tại.",
            )
        other_plan = self.repository.plan_for_pair(
            db,
            payload.ma_don_hang,
            payload.ma_san_pham,
        )
        if (
            other_plan is not None
            and (
                plan is None
                or other_plan.ma_ke_hoach != plan.ma_ke_hoach
            )
        ):
            raise HTTPException(
                status_code=409,
                detail="Mã đơn và sản phẩm đã tồn tại trong KHSX.",
            )
        # Kiểm tra điều kiện CTKM trước khi lưu.
        self._validate_ctkm(db, payload)
        price = payload.gia_goc
        if price is None and use_product_price:
            if (
                model is not None
                and model.ma_san_pham == payload.ma_san_pham
            ):
                price = model.gia_goc
            else:
                price = product.don_gia
        values = payload.model_dump()
        values["gia_goc"] = price
        validated = DuLieuBanHangCreateRequest.model_validate(
            values
        )
        delivered = (
            validated.trang_thai_don_hang == "DA_GIAO_HANG"
        )
        if model is None:
            model = LichSuTieuThu()
            db.add(model)
        model.ma_don_hang = validated.ma_don_hang
        model.ma_san_pham = validated.ma_san_pham
        model.ngay_giao_hang = validated.ngay_giao_hang
        model.ngay_ban = validated.ngay_ban
        model.so_luong_ban = validated.so_luong
        model.gia_goc = validated.gia_goc
        model.muc_giam_gia = validated.muc_giam_gia
        model.gia_ban_sau_giam = validated.gia_ban_sau_giam
        model.co_khuyen_mai = validated.co_khuyen_mai
        model.chuong_trinh_km = validated.chuong_trinh_km
        model.ma_ctkm = validated.ma_ctkm
        model.kenh_ban_hang = validated.kenh_ban_hang
        model.ma_ngay_le = validated.ma_ngay_le
        model.trang_thai_don_hang = (
            validated.trang_thai_don_hang
        )
        model.trang_thai_san_xuat = (
            "DA_SAN_XUAT" if delivered else "CHO_SAN_XUAT"
        )
        if not delivered and plan is None:
            plan = KeHoachSanXuat()
            db.add(plan)
        if plan is not None:
            plan.ma_don_hang = validated.ma_don_hang
            plan.ma_san_pham = validated.ma_san_pham
            plan.ngay_ban = validated.ngay_ban
            plan.so_luong = validated.so_luong
            plan.gia_goc = validated.gia_goc
            plan.trang_thai_san_xuat = (
                model.trang_thai_san_xuat
            )
            db.flush()
            model.ma_ke_hoach_nguon = plan.ma_ke_hoach
        db.flush()
        return self._response(
            model,
            product.ten_san_pham,
        )
