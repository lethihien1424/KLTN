from datetime import date

from sqlalchemy.orm import Session

from src.models.ke_hoach_san_xuat_model import (
    KeHoachSanXuat,
)
from src.models.lich_su_tieu_thu_model import (
    LichSuTieuThu,
)


class TieuThuRepository:

    @staticmethod
    def get_lich_su_tieu_thu(
        db: Session,
        ma_san_pham: str,
        ngay_chay: date,
    ):
        return (
            db.query(LichSuTieuThu)
            .filter(
                LichSuTieuThu.ma_san_pham
                == ma_san_pham,
                LichSuTieuThu.ngay_ban
                < ngay_chay,
                LichSuTieuThu.trang_thai_san_xuat
                == "DA_SAN_XUAT",
            )
            .order_by(
                LichSuTieuThu.ngay_ban.asc()
            )
            .all()
        )

    @staticmethod
    def get_ke_hoach_san_xuat_qua_khu(
        db: Session,
        ma_san_pham: str,
        ngay_chay: date,
    ):
        return (
            db.query(KeHoachSanXuat)
            .filter(
                KeHoachSanXuat.ma_san_pham
                == ma_san_pham,
                KeHoachSanXuat.ngay_don_hang
                < ngay_chay,
                KeHoachSanXuat.trang_thai_san_xuat
                == "CHO_SAN_XUAT",
            )
            .order_by(
                KeHoachSanXuat.ngay_don_hang.asc()
            )
            .all()
        )

    @staticmethod
    def get_nhu_cau_qua_khu(
        db: Session,
        ma_san_pham: str,
        ngay_chay: date,
    ) -> list[dict]:

        lich_su = (
            TieuThuRepository.get_lich_su_tieu_thu(
                db=db,
                ma_san_pham=ma_san_pham,
                ngay_chay=ngay_chay,
            )
        )

        ke_hoach = (
            TieuThuRepository
            .get_ke_hoach_san_xuat_qua_khu(
                db=db,
                ma_san_pham=ma_san_pham,
                ngay_chay=ngay_chay,
            )
        )

        du_lieu = []
        khoa_da_co = set()

        for item in lich_su:
            khoa = (
                item.ma_don_hang,
                item.ma_san_pham,
            )

            if khoa in khoa_da_co:
                continue

            khoa_da_co.add(khoa)

            du_lieu.append(
                {
                    "ma_don_hang": item.ma_don_hang,
                    "ma_san_pham": item.ma_san_pham,
                    "ngay": item.ngay_ban,
                    "so_luong": item.so_luong_ban,
                    "nguon": "LICH_SU_TIEU_THU",
                }
            )

        for item in ke_hoach:
            khoa = (
                item.ma_don_hang,
                item.ma_san_pham,
            )

            # Phòng trường hợp dữ liệu bất thường
            # xuất hiện ở cả hai bảng.
            if khoa in khoa_da_co:
                continue

            khoa_da_co.add(khoa)

            du_lieu.append(
                {
                    "ma_don_hang": item.ma_don_hang,
                    "ma_san_pham": item.ma_san_pham,
                    "ngay": item.ngay_don_hang,
                    "so_luong": item.so_luong,
                    "nguon": "KE_HOACH_SAN_XUAT",
                }
            )

        du_lieu.sort(
            key=lambda x: (
                x["ngay"],
                x["ma_don_hang"],
            )
        )

        return du_lieu