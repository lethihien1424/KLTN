from decimal import Decimal

from src.repositories.dashboard_repository import DashboardRepository


class DashboardService:
    PROPOSAL_STATUSES = ("CHO_DUYET", "DA_DUYET", "TU_CHOI")
    ORDER_STATUSES = ("CHUA_DUYET", "DA_DUYET", "TU_CHOI", "DA_NHAN_HANG")

    def __init__(self):
        self.repository = DashboardRepository()

    def inventory_alerts(self, db):
        return [{
            "ma_nguyen_lieu": stock.ma_nguyen_lieu,
            "ten_nguyen_lieu": material.ten_nguyen_lieu,
            "don_vi_do_luong": material.don_vi_do_luong,
            "ngay_ghi_nhan": stock.ngay_ghi_nhan,
            "ton_kho_thuc_te": stock.ton_kho_thuc_te,
            "so_luong_book": stock.so_luong_book,
            "ton_kho_kha_dung": stock.ton_kho_kha_dung,
            "ton_kho_an_toan": stock.ton_kho_an_toan,
            "so_luong_thieu_an_toan": max(
                Decimal("0"), stock.ton_kho_an_toan - stock.ton_kho_kha_dung
            ),
        } for stock, material in self.repository.low_stock(db)]

    def overview(self, db):
        proposals = {status: 0 for status in self.PROPOSAL_STATUSES}
        proposals.update(self.repository.proposal_counts(db))
        orders = {status: 0 for status in self.ORDER_STATUSES}
        orders.update(self.repository.order_counts(db))
        values = self.repository.purchase_values(db)
        supplier_count, with_performance = self.repository.active_supplier_counts(db)
        return {
            "nguyen_lieu": {
                "tong_so": self.repository.active_material_count(db),
                "duoi_ton_an_toan": len(self.repository.low_stock(db)),
            },
            "de_xuat_nhap_hang": proposals,
            "don_mua": orders,
            "mua_hang": {
                "gia_tri_da_duyet": values.get("DA_DUYET") or Decimal("0.00"),
                "gia_tri_da_nhan_hang": values.get("DA_NHAN_HANG") or Decimal("0.00"),
            },
            "nha_cung_cap": {
                "tong_so": supplier_count,
                "co_du_lieu_hieu_suat_thuc_te": with_performance,
            },
        }

    def supplier_performance(self, db):
        return [{
            "ma_ncc": supplier.ma_ncc,
            "ten_ncc": supplier.ten_ncc,
            "diem_ncc": supplier.diem_dieu_kien_thuong_mai,
            "ty_le_giao_dung_han_thuc_te": supplier.ty_le_giao_dung_han_thuc_te,
            "ty_le_giao_du_thuc_te": supplier.ty_le_giao_du_thuc_te,
        } for supplier in self.repository.active_supplier_performance(db)]
