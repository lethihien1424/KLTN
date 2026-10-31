from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy import select
from src.models.stock_movement_model import StockMovement, StockReservation
from src.models.ke_hoach_san_xuat_model import KeHoachSanXuat
from src.models.san_pham_model import SanPham
from src.models.user_model import User
from src.models.chi_tiet_don_mua import ChiTietDonMua
from src.models.don_mua_nguyen_lieu import DonMuaNguyenLieu
from src.models.nha_cung_cap_model import NhaCungCap
from src.services.ton_kho_service import TonKhoService


def stock_status(row):
    if row["ton_kho_kha_dung"] < 0:
        return "TON_AM"
    return "CAN_NHAP" if row["ton_kho_kha_dung"] < row["ton_kho_an_toan"] else "BINH_THUONG"


def filtered_stocks(db, search="", muc_ton="", ngay_ghi_nhan=None):
    rows = TonKhoService().list(db, latest_only=True, search=search, ngay_ghi_nhan=ngay_ghi_nhan)
    return [row for row in rows if not muc_ton or stock_status(row) == muc_ton]


def stock_detail(db, code):
    service = TonKhoService()
    material = service.repository.material(db, code)
    rows = service.repository.history(db, code)
    if material is None or not rows:
        raise HTTPException(404, "Không tìm thấy tồn kho nguyên liệu.")
    stock = service._responses(db, [rows[0]])[0]
    purchase_scale = Decimal("1000") if material.don_vi_do_luong.strip().lower() == "g" else Decimal("1")
    movements = db.execute(select(StockMovement, User.ho_ten).join(
        User, StockMovement.nguoi_thuc_hien == User.ma_nguoi_dung
    ).where(StockMovement.ma_nguyen_lieu == code).order_by(StockMovement.thoi_gian.desc(), StockMovement.id)).all()
    orders = db.execute(select(ChiTietDonMua, DonMuaNguyenLieu, NhaCungCap.ten_ncc)
                        .join(DonMuaNguyenLieu, ChiTietDonMua.ma_don_mua == DonMuaNguyenLieu.ma_don_mua)
                        .join(NhaCungCap, DonMuaNguyenLieu.ma_ncc == NhaCungCap.ma_ncc)
                        .where(ChiTietDonMua.ma_nguyen_lieu == code)
                        .order_by(DonMuaNguyenLieu.ngay_dat_hang.desc())).all()
    holds = list(db.scalars(select(StockReservation).where(StockReservation.ma_nguyen_lieu == code)))
    sourced = sum((row.so_luong_giu - row.so_luong_xuat for row in holds if row.da_huy != "Y"), Decimal("0"))
    return {
        "ton_kho": stock,
        "ngay_cap_nhat_gan_nhat": movements[0][0].thoi_gian if movements else stock["ngay_ghi_nhan"],
        "hang_dang_ve": stock["hang_dang_ve"],
        "da_giu_chua_co_nguon": stock["so_luong_book"] - sourced,
        "giu_theo_ke_hoach": [{key: getattr(row, key) for key in (
            "ma_ke_hoach", "ma_cong_thuc", "so_luong_giu", "so_luong_xuat", "da_huy")} for row in holds],
        "giao_dich": [{**{col.name: getattr(row, col.name) for col in StockMovement.__table__.columns},
                       "ten_nguoi_thuc_hien": name} for row, name in movements],
        "don_mua": [{"ma_don_mua": order.ma_don_mua, "ten_ncc": supplier,
                     "so_luong_mua": line.so_luong_mua * purchase_scale, "so_luong_thuc_nhan": line.so_luong_thuc_nhan * purchase_scale,
                     "con_cho_giao": max(line.so_luong_mua - line.so_luong_thuc_nhan, Decimal("0")) * purchase_scale if order.trang_thai == "DA_DUYET" else Decimal("0"),
                     "ngay_du_kien_giao": order.ngay_du_kien_giao, "trang_thai": order.trang_thai}
                    for line, order, supplier in orders],
    }


def production_plans(db):
    stocks = {row["ma_nguyen_lieu"]: row for row in filtered_stocks(db)}
    holds = {}
    for row in db.scalars(select(StockReservation)):
        holds.setdefault(row.ma_ke_hoach, []).append({
            **{key: getattr(row, key) for key in ("ma_nguyen_lieu", "ma_cong_thuc", "so_luong_giu", "so_luong_xuat", "da_huy")},
            "ten_nguyen_lieu": stocks.get(row.ma_nguyen_lieu, {}).get("ten_nguyen_lieu", row.ma_nguyen_lieu),
            "don_vi_do_luong": stocks.get(row.ma_nguyen_lieu, {}).get("don_vi_do_luong", ""),
        })
    return [{"ma_ke_hoach": plan.ma_ke_hoach, "ten_san_pham": name, "so_luong": plan.so_luong,
             "trang_thai": plan.trang_thai_san_xuat, "chi_tiet": holds.get(plan.ma_ke_hoach, [])}
            for plan, name in db.execute(select(KeHoachSanXuat, SanPham.ten_san_pham).join(SanPham)
                                         .order_by(KeHoachSanXuat.ma_ke_hoach))]
