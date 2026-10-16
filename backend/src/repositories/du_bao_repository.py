##D:\KLTN\KLTN\backend\src\repositories\du_bao_repository.py
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.chi_tiet_lich_su_du_bao import (
    ChiTietLichSuDuBao,
)
from src.models.danh_gia_mo_hinh import (
    DanhGiaMoHinh,
)
from src.models.lich_su_du_bao import (
    LichSuDuBao,
)
from src.models.san_pham_model import SanPham
from src.models.user_model import User


class DuBaoRepository:
    @staticmethod
    def lay_san_pham(
        db: Session,
        ma_san_pham: list[str] | None = None,
    ) -> list[SanPham]:
        statement = (
            select(SanPham)
            .where(
                SanPham.trang_thai
                == "DANG_KINH_DOANH"
            )
            .order_by(SanPham.ma_san_pham)
        )

        if ma_san_pham is not None:
            statement = statement.where(
                SanPham.ma_san_pham.in_(ma_san_pham)
            )

        products = list(
            db.scalars(statement).all()
        )

        if ma_san_pham is not None:
            found_ids = {
                product.ma_san_pham
                for product in products
            }

            missing_ids = (
                set(ma_san_pham) - found_ids
            )

            if missing_ids:
                raise ValueError(
                    "Các sản phẩm không tồn tại hoặc "
                    "không còn kinh doanh: "
                    + ", ".join(sorted(missing_ids))
                )

        return products

    @staticmethod
    def tao_lich_su(
        db: Session,
        lich_su: LichSuDuBao,
    ) -> LichSuDuBao:
        db.add(lich_su)
        db.flush()
        return lich_su

    @staticmethod
    def tao_chi_tiet(
        db: Session,
        chi_tiet: ChiTietLichSuDuBao,
    ) -> ChiTietLichSuDuBao:
        db.add(chi_tiet)
        return chi_tiet

    @staticmethod
    def cap_nhat_tham_so(
        lich_su: LichSuDuBao,
        tham_so: dict,
    ) -> None:
        lich_su.tham_so = tham_so

    @staticmethod
    def lay_danh_sach_lich_su(
        db: Session,
    ):
        return db.execute(
            select(
                LichSuDuBao,
                User.ho_ten.label(
                    "ho_ten_nguoi_thuc_hien"
                ),
            )
            .outerjoin(
                User,
                User.ma_nguoi_dung
                == LichSuDuBao.nguoi_thuc_hien,
            )
            .where(
                LichSuDuBao.cau_hinh_mo_hinh
                == "PROPHET",
                LichSuDuBao.so_tuan_du_bao.between(
                    1, 8
                ),
            )
            .order_by(
                LichSuDuBao.thoi_gian_chay.desc(),
                LichSuDuBao.ma_lich_su_du_bao.desc(),
            )
        ).all()

    @staticmethod
    def lay_lich_su_theo_ma(
        db: Session,
        ma_lich_su_du_bao: str,
    ) -> LichSuDuBao | None:
        return db.scalar(
            select(LichSuDuBao)
            .where(
                LichSuDuBao.ma_lich_su_du_bao
                == ma_lich_su_du_bao,
                LichSuDuBao.cau_hinh_mo_hinh
                == "PROPHET",
                LichSuDuBao.so_tuan_du_bao.between(
                    1, 8
                ),
            )
        )

    @staticmethod
    def lay_lich_su_moi_nhat(
        db: Session,
    ) -> LichSuDuBao | None:
        return db.scalar(
            select(LichSuDuBao)
            .where(
                LichSuDuBao.trang_thai
                == "THANH_CONG",
                LichSuDuBao.cau_hinh_mo_hinh
                == "PROPHET",
                LichSuDuBao.so_tuan_du_bao.between(
                    1, 8
                ),
            )
            .order_by(
                LichSuDuBao.thoi_gian_chay.desc(),
                LichSuDuBao.ma_lich_su_du_bao.desc(),
            )
            .limit(1)
        )

    @staticmethod
    def lay_chi_tiet_da_luu(
        db: Session,
        ma_lich_su_du_bao: str,
    ) -> list[ChiTietLichSuDuBao]:
        return list(
            db.scalars(
                select(ChiTietLichSuDuBao)
                .where(
                    ChiTietLichSuDuBao.ma_lich_su_du_bao
                    == ma_lich_su_du_bao,
                    ChiTietLichSuDuBao.ma_nguyen_lieu.is_(
                        None
                    ),
                )
                .order_by(
                    ChiTietLichSuDuBao.ma_san_pham,
                    ChiTietLichSuDuBao.tu_ngay,
                )
            ).all()
        )

    @staticmethod
    def lay_danh_gia_da_luu(
        db: Session,
        ma_lich_su_du_bao: str,
    ) -> list[DanhGiaMoHinh]:
        return list(
            db.scalars(
                select(DanhGiaMoHinh)
                .where(
                    DanhGiaMoHinh.ma_lich_su_du_bao
                    == ma_lich_su_du_bao
                )
                .order_by(
                    DanhGiaMoHinh.ma_san_pham,
                    DanhGiaMoHinh.mo_hinh,
                )
            ).all()
        )

    @staticmethod
    def lay_ten_san_pham(
        db: Session,
    ) -> dict[str, str]:
        return {
            row.ma_san_pham: row.ten_san_pham
            for row in db.execute(
                select(
                    SanPham.ma_san_pham,
                    SanPham.ten_san_pham,
                )
            ).all()
        }