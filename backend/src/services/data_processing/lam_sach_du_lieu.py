### backend/src/services/data_processing/lam_sach_du_lieu.py
from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

import pandas as pd
from sqlalchemy import select, tuple_
from sqlalchemy.orm import Session

from src.models.ke_hoach_san_xuat_model import KeHoachSanXuat
from src.models.lich_su_tieu_thu_model import LichSuTieuThu
from src.models.san_pham_model import SanPham
from src.services.data_processing.kiem_tra_du_lieu import (
    is_empty,
    to_boolean,
    to_date,
    to_decimal,
    to_integer,
    to_string,
)


def lam_sach_don_hang(
    dataframe: pd.DataFrame,
    db: Session,
) -> pd.DataFrame:
    rows = []
    seen = set()

    for _, source in dataframe.iterrows():
        row_number = int(source["_row_number"])

        ma_don_hang = to_string(
            source["ma_don_hang"],
            "ma_don_hang",
            row_number,
        )
        ma_san_pham = to_string(
            source["ma_san_pham"],
            "ma_san_pham",
            row_number,
        )

        key = (ma_don_hang, ma_san_pham)
        if key in seen:
            raise ValueError(
                f"Dòng {row_number}: đơn {ma_don_hang}, "
                f"sản phẩm {ma_san_pham} bị lặp trong file."
            )
        seen.add(key)

        status = to_string(
            source["trang_thai_don_hang"],
            "trang_thai_don_hang",
            row_number,
        )
        status = status.upper().replace(" ", "_")

        if status in {"ĐÃ_GIAO_HÀNG", "ĐÃ_GIAO_HANG"}:
            status = "DA_GIAO_HANG"
        elif status in {"CHỜ_GIAO_HÀNG", "CHỜ_GIAO_HANG"}:
            status = "CHO_GIAO_HANG"

        if status not in {"DA_GIAO_HANG", "CHO_GIAO_HANG"}:
            raise ValueError(
                f"Dòng {row_number}: trạng thái đơn hàng không hợp lệ."
            )

        ngay = to_date(
            source["ngay_don_hang"],
            "ngay_don_hang",
            row_number,
        )

        hom_nay = datetime.now(
            ZoneInfo("Asia/Ho_Chi_Minh")
        ).date()

        if status == "DA_GIAO_HANG" and ngay > hom_nay:
            raise ValueError(
                f"Dòng {row_number}: đơn đã giao "
                "không thể có ngày tương lai."
            )

        so_luong = to_integer(
            source["so_luong"],
            "so_luong",
            row_number,
        )
        if so_luong <= 0:
            raise ValueError(
                f"Dòng {row_number}: so_luong phải lớn hơn 0."
            )

        cleaned = source.to_dict()
        cleaned.update(
            ma_don_hang=ma_don_hang,
            ma_san_pham=ma_san_pham,
            ngay_don_hang=ngay,
            so_luong=so_luong,
            trang_thai_don_hang=status,
        )

        if status == "DA_GIAO_HANG":
            gia_goc = to_decimal(
                source.get("gia_goc"),
                "gia_goc",
                row_number,
                required=False,
            )
            gia_sau_giam = to_decimal(
                source.get("gia_ban_sau_giam"),
                "gia_ban_sau_giam",
                row_number,
                required=False,
            )

            raw_discount = source.get("muc_giam_gia")
            if (
                isinstance(raw_discount, str)
                and raw_discount.strip().endswith("%")
            ):
                muc_giam = (
                    to_decimal(
                        raw_discount.strip()[:-1],
                        "muc_giam_gia",
                        row_number,
                    )
                    / 100
                )
            else:
                muc_giam = to_decimal(
                    raw_discount,
                    "muc_giam_gia",
                    row_number,
                    required=False,
                )

            if muc_giam is None:
                muc_giam = Decimal("0")

            if not Decimal("0") <= muc_giam <= Decimal("1"):
                raise ValueError(
                    f"Dòng {row_number}: muc_giam_gia "
                    "phải từ 0 đến 1."
                )

            if (
                (gia_goc is not None and gia_goc < 0)
                or (
                    gia_sau_giam is not None
                    and gia_sau_giam < 0
                )
            ):
                raise ValueError(
                    f"Dòng {row_number}: giá không được âm."
                )

            if gia_goc is not None and gia_sau_giam is not None:
                gia_ky_vong = (
                    gia_goc * (1 - muc_giam)
                ).quantize(Decimal("0.01"))

                if abs(gia_sau_giam - gia_ky_vong) > Decimal("0.01"):
                    raise ValueError(
                        f"Dòng {row_number}: gia_ban_sau_giam "
                        "không khớp giá gốc và mức giảm."
                    )

            raw_promo = source.get("co_khuyen_mai")
            co_khuyen_mai = (
                False
                if is_empty(raw_promo)
                else to_boolean(
                    raw_promo,
                    "co_khuyen_mai",
                    row_number,
                )
            )

            if muc_giam > 0 and not co_khuyen_mai:
                raise ValueError(
                    f"Dòng {row_number}: có giảm giá nhưng "
                    "co_khuyen_mai là FALSE."
                )

            cleaned.update(
                gia_goc=gia_goc,
                muc_giam_gia=muc_giam,
                gia_ban_sau_giam=gia_sau_giam,
                co_khuyen_mai=co_khuyen_mai,
            )

        rows.append(cleaned)

    keys = [
        (row["ma_don_hang"], row["ma_san_pham"])
        for row in rows
    ]
    product_ids = {
        row["ma_san_pham"]
        for row in rows
    }

    existing_products = set(
        db.execute(
            select(SanPham.ma_san_pham).where(
                SanPham.ma_san_pham.in_(product_ids)
            )
        ).scalars()
    )

    missing_products = product_ids - existing_products
    if missing_products:
        raise ValueError(
            "Mã sản phẩm không tồn tại: "
            + ", ".join(sorted(missing_products))
            + "."
        )

    # Kiểm tra ở CẢ HAI bảng, tránh cùng một đơn tồn tại
    # một lần dưới dạng đã giao và một lần dưới dạng chờ.
    for model in (LichSuTieuThu, KeHoachSanXuat):
        existing_orders = set(
            db.execute(
                select(
                    model.ma_don_hang,
                    model.ma_san_pham,
                ).where(
                    tuple_(
                        model.ma_don_hang,
                        model.ma_san_pham,
                    ).in_(keys)
                )
            ).all()
        )

        if existing_orders:
            order_id, product_id = sorted(
                existing_orders
            )[0]
            raise ValueError(
                f"Đơn {order_id}, sản phẩm {product_id} "
                "đã có trong cơ sở dữ liệu."
            )

    return pd.DataFrame(
        rows,
        columns=dataframe.columns,
    )