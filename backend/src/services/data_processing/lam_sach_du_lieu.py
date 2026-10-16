### backend/src/services/data_processing/lam_sach_du_lieu.py
from decimal import Decimal

import pandas as pd
from pydantic import ValidationError
from sqlalchemy.orm import Session

from src.schemas.du_lieu_ban_hang_schema import (
    DuLieuBanHangCreateRequest,
)
from src.services.data_processing.kiem_tra_du_lieu import (
    is_empty,
    to_boolean,
    to_date,
    to_decimal,
    to_integer,
    to_string,
)
from src.services.data_processing.template_validator import (
    validate_columns,
)


def lam_sach_don_hang(
    dataframe: pd.DataFrame,
    db: Session,
) -> pd.DataFrame:
    validate_columns(
        dataframe=dataframe,
        required_columns={
            "ma_don_hang",
            "ma_san_pham",
            "ngay_ban",
            "so_luong",
            "trang_thai_don_hang",
        },
        optional_columns={
            "gia_goc",
            "muc_giam_gia",
            "gia_ban_sau_giam",
            "co_khuyen_mai",
            "chuong_trinh_km",
            "ma_ctkm",
            "kenh_ban_hang",
            "ma_ngay_le",
        },
    )

    mapping = {
        "CHO_GIAO_HANG": "CHO_GIAO_HANG",
        "CHỜ_GIAO_HÀNG": "CHO_GIAO_HANG",
        "CHỜ_GIAO_HANG": "CHO_GIAO_HANG",
        "DA_GIAO_HANG": "DA_GIAO_HANG",
        "ĐÃ_GIAO_HÀNG": "DA_GIAO_HANG",
        "ĐÃ_GIAO_HANG": "DA_GIAO_HANG",
    }

    rows = []
    seen = set()

    for _, source in dataframe.iterrows():
        number = int(source["_row_number"])

        raw_status = to_string(
            source["trang_thai_don_hang"],
            "trang_thai_don_hang",
            number,
        )

        normalized = "_".join(raw_status.upper().split())
        order_status = mapping.get(normalized)

        if order_status is None:
            raise ValueError(
                f"Dòng {number}: trạng thái đơn không hợp lệ."
            )

        raw_discount = source.get("muc_giam_gia")

        if (
            isinstance(raw_discount, str)
            and raw_discount.strip().endswith("%")
        ):
            discount = to_decimal(
                raw_discount.strip()[:-1],
                "muc_giam_gia",
                number,
            ) / Decimal("100")
        else:
            discount = to_decimal(
                raw_discount,
                "muc_giam_gia",
                number,
                required=False,
            )

        if discount is None:
            discount = Decimal("0")

        campaign = to_string(
            source.get("chuong_trinh_km"),
            "chuong_trinh_km",
            number,
            required=False,
        )

        campaign_code = to_string(
            source.get("ma_ctkm"),
            "ma_ctkm",
            number,
            required=False,
        )

        raw_promotion = source.get("co_khuyen_mai")

        promotion = (
            discount > 0
            or campaign is not None
            or campaign_code is not None
        ) if is_empty(raw_promotion) else to_boolean(
            raw_promotion,
            "co_khuyen_mai",
            number,
        )


        try:
            payload = DuLieuBanHangCreateRequest(
                ma_don_hang=to_string(
                    source["ma_don_hang"],
                    "ma_don_hang",
                    number,
                ),
                ma_san_pham=to_string(
                    source["ma_san_pham"],
                    "ma_san_pham",
                    number,
                ),
                ngay_ban=to_date(
                    source["ngay_ban"],
                    "ngay_ban",
                    number,
                ),
                ngay_giao_hang=None,
                so_luong=to_integer(
                    source["so_luong"],
                    "so_luong",
                    number,
                ),
                trang_thai_don_hang=order_status,
                gia_goc=to_decimal(
                    source.get("gia_goc"),
                    "gia_goc",
                    number,
                    required=False,
                ),
                muc_giam_gia=discount,
                gia_ban_sau_giam=to_decimal(
                    source.get("gia_ban_sau_giam"),
                    "gia_ban_sau_giam",
                    number,
                    required=False,
                ),
                co_khuyen_mai=promotion,
                chuong_trinh_km=campaign,
                ma_ctkm=campaign_code,
                kenh_ban_hang=to_string(
                    source.get("kenh_ban_hang"),
                    "kenh_ban_hang",
                    number,
                    required=False,
                ),
                ma_ngay_le=to_string(
                    source.get("ma_ngay_le"),
                    "ma_ngay_le",
                    number,
                    required=False,
                ),
            )

        except ValidationError as exc:
            raise ValueError(
                f"Dòng {number}: "
                + "; ".join(
                    item["msg"]
                    for item in exc.errors()
                )
            ) from exc

        key = (
            payload.ma_don_hang,
            payload.ma_san_pham,
        )

        if key in seen:
            raise ValueError(
                f"Dòng {number}: đơn {key[0]}, "
                f"sản phẩm {key[1]} bị lặp trong file."
            )

        seen.add(key)

        values = payload.model_dump()
        values["_row_number"] = number
        rows.append(values)

    return pd.DataFrame(rows, dtype=object)


# =====================================================
# LÀM SẠCH CHƯƠNG TRÌNH KHUYẾN MÃI
# =====================================================

CTKM_COLUMNS = [
    "ma_ctkm",
    "ma_ctkm_goc",
    "ten_ctkm",
    "ngay_bat_dau",
    "ngay_ket_thuc",
    "so_luong_dat_quy_dinh",
    "hinh_thuc_uu_dai",
    "muc_giam_phan_tram",
    "ma_san_pham_ap_dung",
    "trang_thai",
]

CTKM_STATUSES = {
    "SAP_DIEN_RA",
    "DANG_DIEN_RA",
    "KET_THUC",
    "HUY",
}


def _ctkm_text(
    source,
    column: str,
    row_number: int,
    max_length: int,
    required: bool = True,
):
    value = to_string(
        source.get(column),
        column,
        row_number,
        required=required,
    )

    if value is not None and len(value) > max_length:
        raise ValueError(
            f"Dòng {row_number}: cột '{column}' "
            f"vượt quá {max_length} ký tự."
        )

    return value


def _ctkm_products(
    value,
    row_number: int,
) -> set[str]:
    raw = to_string(
        value,
        "ma_san_pham_ap_dung",
        row_number,
    )

    codes = [code.strip() for code in raw.split(",")]

    if any(not code for code in codes):
        raise ValueError(
            f"Dòng {row_number}: danh sách sản phẩm "
            "có mã trống hoặc dấu phẩy thừa."
        )

    if any(len(code) > 20 for code in codes):
        raise ValueError(
            f"Dòng {row_number}: mã sản phẩm "
            "vượt quá 20 ký tự."
        )

    if len(codes) != len(set(codes)):
        raise ValueError(
            f"Dòng {row_number}: mã sản phẩm "
            "bị lặp trong danh sách áp dụng."
        )

    return set(codes)


def lam_sach_ctkm(
    dataframe: pd.DataFrame,
) -> list[dict]:
    validate_columns(
        dataframe=dataframe,
        required_columns=set(CTKM_COLUMNS),
    )

    actual_columns = [
        column
        for column in dataframe.columns
        if column != "_row_number"
    ]

    if actual_columns != CTKM_COLUMNS:
        raise ValueError(
            "File CTKM sai thứ tự cột. "
            "Thứ tự đúng: "
            + ", ".join(CTKM_COLUMNS)
        )

    cleaned = []
    seen = set()

    for _, source in dataframe.iterrows():
        number = int(source["_row_number"])

        code = _ctkm_text(
            source, "ma_ctkm", number, 30
        )

        if code in seen:
            raise ValueError(
                f"Dòng {number}: mã CTKM {code} "
                "bị lặp trong file."
            )

        seen.add(code)

        start = to_date(
            source["ngay_bat_dau"],
            "ngay_bat_dau",
            number,
        )

        end = to_date(
            source["ngay_ket_thuc"],
            "ngay_ket_thuc",
            number,
        )

        if end < start:
            raise ValueError(
                f"Dòng {number}: ngày kết thúc "
                "trước ngày bắt đầu."
            )

        quantity = to_integer(
            source["so_luong_dat_quy_dinh"],
            "so_luong_dat_quy_dinh",
            number,
        )

        if quantity <= 0:
            raise ValueError(
                f"Dòng {number}: số lượng đặt "
                "quy định phải lớn hơn 0."
            )

        method = _ctkm_text(
            source, "hinh_thuc_uu_dai", number, 30
        ).upper()

        if method != "GIAM_PHAN_TRAM":
            raise ValueError(
                f"Dòng {number}: chỉ hỗ trợ "
                "GIAM_PHAN_TRAM."
            )

        discount = to_decimal(
            source["muc_giam_phan_tram"],
            "muc_giam_phan_tram",
            number,
        )

        if not Decimal("0") < discount <= Decimal("100"):
            raise ValueError(
                f"Dòng {number}: mức giảm phải "
                "lớn hơn 0 và không vượt quá 100%."
            )

        if discount != discount.quantize(
            Decimal("0.01")
        ):
            raise ValueError(
                f"Dòng {number}: mức giảm chỉ "
                "được tối đa 2 chữ số thập phân."
            )

        status = _ctkm_text(
            source, "trang_thai", number, 30
        ).upper()

        if status not in CTKM_STATUSES:
            raise ValueError(
                f"Dòng {number}: trạng thái "
                f"CTKM '{status}' không hợp lệ."
            )

        products = _ctkm_products(
            source["ma_san_pham_ap_dung"],
            number,
        )

        cleaned.append({
            "_row_number": number,
            "ma_ctkm": code,
            "ma_ctkm_goc": _ctkm_text(
                source,
                "ma_ctkm_goc",
                number,
                150,
                required=False,
            ),
            "ten_ctkm": _ctkm_text(
                source, "ten_ctkm", number, 200
            ),
            "ngay_bat_dau": start,
            "ngay_ket_thuc": end,
            "so_luong_dat_quy_dinh": quantity,
            "hinh_thuc_uu_dai": method,
            "muc_giam_phan_tram": discount,
            "ma_san_pham_ap_dung": products,
            "trang_thai": status,
        })

    return cleaned