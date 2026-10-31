from src.services.ly_do_service import record_status_change
from contextlib import contextmanager
from datetime import datetime, timezone

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.repositories.cong_thuc_repository import CongThucRepository
from src.schemas.cong_thuc_schema import CongThucUpdate
from src.services.quy_doi_bom_service import QuyDoiBomService


class CongThucService:
    def __init__(self):
        self.repository = CongThucRepository()

    @staticmethod
    def _summary(model, product_name):
        return {
            **{key: getattr(model, key) for key in (
                "ma_cong_thuc", "ten_cong_thuc", "ma_san_pham", "he_so_thu_hoi",
                "ty_le_hao_hut", "trang_thai", "thoi_gian_tao", "thoi_gian_cap_nhat",
            )},
            "ten_san_pham": product_name,
        }

    def list(self, db, search=None, ma_san_pham=None, trang_thai=None):
        return [self._summary(model, name) for model, name in self.repository.list(db, search, ma_san_pham, trang_thai)]

    def _get(self, db, code, lock=False):
        model = self.repository.get(db, code, lock=lock)
        if model is None:
            raise HTTPException(404, "Không tìm thấy công thức.")
        return model

    def detail(self, db, code):
        return self._detail(db, self._get(db, code))

    @staticmethod
    def _product_info(product):
        return {key: getattr(product, key) for key in (
            "ma_san_pham", "ten_san_pham", "khoi_luong", "don_vi_do_luong",
        )}

    def product_info(self, db, code):
        product = self.repository.product(db, code)
        if product is None:
            raise HTTPException(404, "Sản phẩm không tồn tại.")
        return self._product_info(product)

    def _detail(self, db, model):
        product = self.repository.product(db, model.ma_san_pham)
        details = self.repository.details(db, model.ma_cong_thuc)
        quantities = None
        error = None
        try:
            quantities = QuyDoiBomService.per_product(product, model, [row for row, _ in details])
        except HTTPException as exc:
            # Legacy invalid data stays readable and is never silently rewritten.
            error = exc.detail
        return {
            **self._summary(model, product.ten_san_pham),
            "san_pham": self._product_info(product),
            "dinh_luong": quantities,
            "loi_dinh_luong": error,
            "chi_tiet": [dict(
                ma_chi_tiet_cong_thuc=row.ma_chi_tiet_cong_thuc,
                ma_nguyen_lieu=row.ma_nguyen_lieu,
                ten_nguyen_lieu=material.ten_nguyen_lieu,
                don_vi_do_luong=material.don_vi_do_luong,
                ty_le_phoi_tron=row.ty_le_phoi_tron,
            ) for row, material in details],
        }

    def _validate_references(self, db, product_code, items, status=None, exclude=None):
        product = self.repository.product(db, product_code, lock=True)
        if product is None:
            raise HTTPException(422, "Sản phẩm không tồn tại.")
        if product.trang_thai != "DANG_KINH_DOANH":
            raise HTTPException(422, "Sản phẩm đã ngừng kinh doanh.")
        QuyDoiBomService.product_weight_kg(product)
        if status == "DANG_SU_DUNG" and self.repository.active_for_product(db, product_code, exclude):
            raise HTTPException(422, "Sản phẩm đã có BOM đang sử dụng. Mỗi sản phẩm chỉ được có một BOM đang sử dụng.")
        codes = [item.ma_nguyen_lieu for item in items]
        materials = self.repository.materials(db, codes)
        if len(materials) != len(codes):
            raise HTTPException(422, "Có nguyên liệu không tồn tại.")
        if any(row.trang_thai != "DANG_SU_DUNG" for row in materials):
            raise HTTPException(422, "Có nguyên liệu đã ngừng sử dụng.")

    def create_in_transaction(self, db, payload):
        """Also used by import; its caller owns the transaction and commit."""
        self._validate_references(db, payload.ma_san_pham, payload.chi_tiet, payload.trang_thai)
        model = self.repository.create(db, payload.model_dump(exclude={"chi_tiet"}))
        self.repository.replace_details(db, model.ma_cong_thuc, payload.chi_tiet)
        return model

    def create(self, db, payload):
        with self._write(db):
            model = self.create_in_transaction(db, payload)
            result = self._detail(db, model)
        return result

    def update(self, db, code, payload, actor=None):
        with self._write(db):
            model = self._get(db, code, lock=True)
            transition = getattr(payload, "thay_doi_trang_thai", None)
            target_status = model.trang_thai
            if transition is not None:
                if transition.trang_thai_cu != model.trang_thai:
                    raise HTTPException(409, "Trạng thái công thức đã thay đổi. Vui lòng mở lại công thức để kiểm tra trước khi lưu.")
                if transition.trang_thai == model.trang_thai:
                    raise HTTPException(422, "Trạng thái mới phải khác trạng thái hiện tại.")
                target_status = transition.trang_thai
            self._validate_references(db, model.ma_san_pham, payload.chi_tiet, target_status, code)
            if transition is not None:
                record_status_change(db, model, transition, actor, "DOI_TRANG_THAI_CONG_THUC", code)
                model.trang_thai = target_status
            for key, value in payload.model_dump(exclude={"chi_tiet", "thay_doi_trang_thai"}).items():
                setattr(model, key, value)
            model.thoi_gian_cap_nhat = datetime.now(timezone.utc)
            self.repository.replace_details(db, code, payload.chi_tiet)
            result = self._detail(db, model)
        return result

    def update_status(self, db, code, payload, actor=None):
        with self._write(db):
            model = self._get(db, code, lock=True)
            if payload.trang_thai == "DANG_SU_DUNG":
                # Legacy/imported BOMs must be valid before activation.
                try:
                    bom = CongThucUpdate(
                        ten_cong_thuc=model.ten_cong_thuc,
                        he_so_thu_hoi=model.he_so_thu_hoi,
                        ty_le_hao_hut=model.ty_le_hao_hut,
                        chi_tiet=[dict(ma_nguyen_lieu=row.ma_nguyen_lieu, ty_le_phoi_tron=row.ty_le_phoi_tron)
                                  for row, _ in self.repository.details(db, code)],
                    )
                except ValidationError as exc:
                    raise HTTPException(422, "BOM hiện tại không hợp lệ để kích hoạt.") from exc
                self._validate_references(db, model.ma_san_pham, bom.chi_tiet, payload.trang_thai, code)
            record_status_change(db, model, payload, actor, "DOI_TRANG_THAI_CONG_THUC", code)
            model.trang_thai = payload.trang_thai
            model.thoi_gian_cap_nhat = datetime.now(timezone.utc)
            db.flush()
            result = self._detail(db, model)
        return result

    @staticmethod
    @contextmanager
    def _write(db):
        try:
            yield
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            if getattr(exc.orig, "pgcode", None) == "23505":
                raise HTTPException(409, "Dữ liệu công thức bị trùng khóa.") from exc
            raise HTTPException(422, "Dữ liệu vi phạm ràng buộc công thức.") from exc
        except SQLAlchemyError as exc:
            db.rollback()
            raise HTTPException(500, "Không thể lưu công thức.") from exc
        except Exception:
            db.rollback()
            raise
