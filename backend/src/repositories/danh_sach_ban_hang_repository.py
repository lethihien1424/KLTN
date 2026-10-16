####D:\KLTN\KLTN\backend\src\repositories\danh_sach_ban_hang_repository.py
from sqlalchemy import Numeric, String, cast, func, literal, or_, select
from sqlalchemy.orm import Session

from src.models.lich_su_tieu_thu_model import LichSuTieuThu
from src.models.san_pham_model import SanPham


class DanhSachBanHangRepository:
    @staticmethod
    def get_list(
        db: Session,
        search: str | None,
        trang_thai: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        sale_price = func.coalesce(
            LichSuTieuThu.gia_ban_sau_giam,
            func.round(
                LichSuTieuThu.gia_goc
                * (1 - LichSuTieuThu.muc_giam_gia),
                2,
            ),
        )

        statement = (
            select(
                LichSuTieuThu.ma_lich_su.label("ma"),
                literal("lich_su_tieu_thu", type_=String(30)).label("bang_luu"),
                LichSuTieuThu.ma_don_hang,
                LichSuTieuThu.ma_san_pham,
                SanPham.ten_san_pham,
                LichSuTieuThu.ngay_ban,
                LichSuTieuThu.ngay_giao_hang,
                LichSuTieuThu.so_luong_ban.label("so_luong"),
                LichSuTieuThu.trang_thai_don_hang,
                LichSuTieuThu.trang_thai_san_xuat,
                LichSuTieuThu.gia_goc,
                LichSuTieuThu.muc_giam_gia,
                sale_price.label("gia_ban_sau_giam"),
                cast(
                    sale_price * LichSuTieuThu.so_luong_ban,
                    Numeric(30, 2),
                ).label("thanh_tien"),
                LichSuTieuThu.co_khuyen_mai,
                LichSuTieuThu.chuong_trinh_km,
                LichSuTieuThu.ma_ctkm,
                LichSuTieuThu.kenh_ban_hang,
                LichSuTieuThu.ma_ngay_le,
            )
            .join(SanPham, SanPham.ma_san_pham == LichSuTieuThu.ma_san_pham)
        )

        if search and search.strip():
            keyword = search.strip().lower()
            statement = statement.where(
                or_(
                    func.lower(LichSuTieuThu.ma_don_hang).contains(keyword, autoescape=True),
                    func.lower(LichSuTieuThu.ma_san_pham).contains(keyword, autoescape=True),
                    func.lower(SanPham.ten_san_pham).contains(keyword, autoescape=True),
                )
            )

        if trang_thai:
            statement = statement.where(
                LichSuTieuThu.trang_thai_don_hang == trang_thai
            )

        total = db.scalar(
            select(func.count()).select_from(statement.subquery())
        ) or 0

        statement = (
            statement
            .order_by(
                LichSuTieuThu.ngay_ban.desc(),
                LichSuTieuThu.ma_don_hang.asc(),
                LichSuTieuThu.ma_san_pham.asc(),
                LichSuTieuThu.ma_lich_su.asc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        items = [dict(row) for row in db.execute(statement).mappings().all()]
        return items, total
