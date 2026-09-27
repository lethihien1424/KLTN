from contextlib import contextmanager
from collections import defaultdict
from decimal import Decimal
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.repositories.de_xuat_repository import DeXuatRepository
from src.repositories.don_mua_repository import DonMuaRepository
from src.services.don_mua_service import DonMuaService, line_total


class DeXuatNhapHangService:
    def __init__(self):
        self.repository = DeXuatRepository()
        self.order_repository = DonMuaRepository()
        self.order_service = DonMuaService()

    def list(self, db, **filters):
        return self.repository.list(db, **filters)

    def detail(self, db, code):
        model = self.repository.get(db, code)
        if model is None:
            raise HTTPException(404, "Không tìm thấy đề xuất nhập hàng.")
        return self._detail(db, model)

    def _detail(self, db, model):
        return {
            **{key: getattr(model, key) for key in (
                "ma_de_xuat", "ngay_de_xuat_nhap_hang", "ngay_tao_de_xuat",
                "ghi_chu", "trang_thai", "nguoi_tao", "nguoi_duyet",
                "thoi_gian_duyet", "ly_do_tu_choi",
            )},
            "chi_tiet": [{
                "ma_chi_tiet": row.ma_chi_tiet,
                "ma_nguyen_lieu": row.ma_nguyen_lieu,
                "ten_nguyen_lieu": material.ten_nguyen_lieu,
                "ma_ncc": row.ma_ncc,
                "ten_ncc": supplier.ten_ncc,
                "so_luong_de_xuat_kg": row.so_luong_de_xuat_kg,
                "don_gia_du_kien": row.don_gia_du_kien,
            } for row, material, supplier in self.repository.details(db, model.ma_de_xuat)],
        }

    def _validate_details(self, db, items):
        result = []
        for item in items:
            if self.repository.material(db, item.ma_nguyen_lieu, lock=True) is None:
                raise HTTPException(422, f"Nguyên liệu {item.ma_nguyen_lieu} không tồn tại.")
            supplier = self.repository.supplier(db, item.ma_ncc, lock=True)
            if supplier is None:
                raise HTTPException(422, f"Nhà cung cấp {item.ma_ncc} không tồn tại.")
            if supplier.trang_thai != "DANG_HOAT_DONG":
                raise HTTPException(422, f"Nhà cung cấp {item.ma_ncc} đã ngừng hoạt động.")
            mapping = self.repository.mapping(
                db, item.ma_nguyen_lieu, item.ma_ncc, lock=True
            )
            if mapping is None:
                raise HTTPException(
                    422,
                    f"Nhà cung cấp {item.ma_ncc} không cung cấp nguyên liệu {item.ma_nguyen_lieu}.",
                )
            available = mapping.so_luong_ton_kho - mapping.so_luong_book
            if item.so_luong_de_xuat_kg > available:
                raise HTTPException(
                    422,
                    f"Số lượng đề xuất cho {item.ma_nguyen_lieu} vượt tồn khả dụng "
                    f"{available:.2f} kg của {item.ma_ncc}.",
                )
            price = mapping.don_gia_nguyen_lieu
            if price is None or not price.is_finite() or price < 0:
                raise HTTPException(422, "Đơn giá mapping không hợp lệ.")
            result.append({
                "ma_nguyen_lieu": item.ma_nguyen_lieu,
                "ma_ncc": item.ma_ncc,
                "so_luong_de_xuat_kg": item.so_luong_de_xuat_kg,
                "don_gia_du_kien": price,
            })
        return result

    def create(self, db, payload, current_user):
        with self._write(db):
            details = self._validate_details(db, payload.chi_tiet)
            model = self.repository.create(db, {
                "ghi_chu": payload.ghi_chu,
                "trang_thai": "CHO_DUYET",
                "nguoi_tao": current_user.ma_nguoi_dung,
                "nguoi_duyet": None,
                "thoi_gian_duyet": None,
                "ly_do_tu_choi": None,
            })
            self.repository.add_details(db, model.ma_de_xuat, details)
            response = self._detail(db, model)
        return response

    def _process(self, db, code, current_user, target_status, rejection_reason=None):
        with self._write(db):
            model = self.repository.get(db, code, lock=True)
            if model is None:
                raise HTTPException(404, "Không tìm thấy đề xuất nhập hàng.")
            if model.trang_thai != "CHO_DUYET":
                raise HTTPException(409, "Chỉ được xử lý đề xuất đang CHO_DUYET.")
            self.repository.update_workflow(db, model, {
                "trang_thai": target_status,
                "nguoi_duyet": current_user.ma_nguoi_dung,
                "thoi_gian_duyet": datetime.now(timezone.utc),
                "ly_do_tu_choi": rejection_reason if target_status == "TU_CHOI" else None,
            })
            response = self._detail(db, model)
        return response

    def approve(self, db, code, current_user):
        return self._process(db, code, current_user, "DA_DUYET")

    def reject(self, db, code, payload, current_user):
        return self._process(
            db, code, current_user, "TU_CHOI", payload.ly_do_tu_choi
        )

    def generate_orders(self, db, code, payload, current_user):
        with self._write(db):
            proposal = self.repository.get(db, code, lock=True)
            if proposal is None:
                raise HTTPException(404, "Không tìm thấy đề xuất nhập hàng.")
            if proposal.trang_thai != "DA_DUYET":
                raise HTTPException(409, "Chỉ được tạo đơn mua từ đề xuất DA_DUYET.")

            order_date = self.order_repository.current_date(db)
            if payload.ngay_du_kien_giao < order_date:
                raise HTTPException(422, "Ngày dự kiến giao phải từ ngày tạo đơn trở đi.")

            details = self.repository.raw_details(db, code)
            if not details:
                raise HTTPException(422, "Đề xuất đã duyệt không có chi tiết.")

            groups = defaultdict(list)
            totals = defaultdict(lambda: Decimal("0.00"))
            for row in details:
                if not row.ma_ncc:
                    raise HTTPException(422, f"Chi tiết {row.ma_chi_tiet} chưa có nhà cung cấp.")
                quantity = row.so_luong_de_xuat_kg
                price = row.don_gia_du_kien
                if quantity is None or not quantity.is_finite() or quantity <= 0:
                    raise HTTPException(422, f"Chi tiết {row.ma_chi_tiet} có số lượng không hợp lệ.")
                if price is None or not price.is_finite() or price < 0:
                    raise HTTPException(422, f"Chi tiết {row.ma_chi_tiet} có giá snapshot không hợp lệ.")
                item = {
                    "ma_nguyen_lieu": row.ma_nguyen_lieu,
                    "so_luong_mua": quantity,
                    "don_gia_vnd_kg": price,
                }
                groups[row.ma_ncc].append(item)
                totals[row.ma_ncc] += line_total(quantity, price)
                if totals[row.ma_ncc] > Decimal("9999999999999999.99"):
                    raise HTTPException(422, f"Tổng tiền đơn của {row.ma_ncc} vượt giới hạn.")

            existing = self.order_repository.orders_for_proposal(db, code)
            if existing:
                suppliers = ", ".join(row.ma_ncc for row in existing)
                raise HTTPException(
                    409, f"Đề xuất đã sinh đơn mua cho nhà cung cấp: {suppliers}.",
                )

            orders = []
            for supplier_code in sorted(groups):
                model = self.order_repository.create(db, {
                    "ma_ncc": supplier_code,
                    "ma_de_xuat": code,
                    "nguoi_tao": current_user.ma_nguoi_dung,
                    "ngay_dat_hang": order_date,
                    "ngay_du_kien_giao": payload.ngay_du_kien_giao,
                    "ngay_giao_thuc_te": None,
                    "tong_tien": totals[supplier_code],
                    "trang_thai": "CHUA_DUYET",
                    "nguoi_duyet": None,
                    "thoi_gian_duyet": None,
                    "ly_do_tu_choi": None,
                })
                self.order_repository.replace_details(
                    db, model.ma_don_mua, groups[supplier_code]
                )
                orders.append(model)
            response = {
                "ma_de_xuat": code,
                "don_mua": [self.order_service._detail(db, model) for model in orders],
            }
        return response

    @staticmethod
    @contextmanager
    def _write(db):
        try:
            yield
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            if getattr(getattr(exc.orig, "diag", None), "constraint_name", None) == "uq_don_mua_de_xuat_ncc":
                raise HTTPException(409, "Đề xuất đã sinh đơn mua cho nhà cung cấp này.") from exc
            raise HTTPException(422, "Dữ liệu đề xuất vi phạm ràng buộc cơ sở dữ liệu.") from exc
        except SQLAlchemyError as exc:
            db.rollback()
            raise HTTPException(500, "Không thể lưu đề xuất nhập hàng.") from exc
        except Exception:
            db.rollback()
            raise
