### backend/src/services/data_processing/kiem_tra_du_lieu.py
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

import pandas as pd


def is_empty(value) -> bool:
    if value is None:
        return True

    try:
        if pd.isna(value):
            return True
    except (TypeError, ValueError):
        pass

    return isinstance(value, str) and not value.strip()


def to_string(
    value,
    column: str,
    row_number: int,
    required: bool = True,
) -> str | None:
    if is_empty(value):
        if required:
            raise ValueError(
                f"Dòng {row_number}: cột '{column}' không được để trống."
            )
        return None

    return str(value).strip()


def to_decimal(
    value,
    column: str,
    row_number: int,
    required: bool = True,
) -> Decimal | None:
    if is_empty(value):
        if required:
            raise ValueError(
                f"Dòng {row_number}: cột '{column}' không được để trống."
            )
        return None

    try:
        if isinstance(value, bool):
            raise ValueError("Boolean không phải số.")

        if isinstance(value, str):
            raw = value.strip()

            # Chấp nhận 1234.50 hoặc 1,234.50.
            # Không đoán định dạng như 1.234,50.
            pattern = (
                r"[+-]?"
                r"(?:\d+|\d{1,3}(?:,\d{3})+)"
                r"(?:\.\d+)?"
            )

            if not re.fullmatch(pattern, raw):
                raise ValueError("Định dạng số không hợp lệ.")

            value = raw.replace(",", "")

        result = Decimal(str(value))

        if not result.is_finite():
            raise ValueError("Số không hữu hạn.")

        return result

    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError(
            f"Dòng {row_number}: cột '{column}' phải là số hợp lệ."
        ) from exc


def to_integer(
    value,
    column: str,
    row_number: int,
) -> int:
    result = to_decimal(
        value=value,
        column=column,
        row_number=row_number,
    )

    if result != result.to_integral_value():
        raise ValueError(
            f"Dòng {row_number}: cột '{column}' phải là số nguyên."
        )

    return int(result)


def to_date(
    value,
    column: str,
    row_number: int,
) -> date:
    if is_empty(value):
        raise ValueError(
            f"Dòng {row_number}: cột '{column}' không được để trống."
        )

    # Excel thường được pandas đọc thành date hoặc datetime.
    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    if isinstance(value, str):
        raw = value.strip()

        for date_format in ("%d/%m/%Y", "%d-%m-%Y"):
            try:
                return datetime.strptime(
                    raw,
                    date_format,
                ).date()
            except ValueError:
                continue

    raise ValueError(
        f"Dòng {row_number}: cột '{column}' phải theo định dạng "
        "DD/MM/YYYY hoặc DD-MM-YYYY."
    )


def to_boolean(
    value,
    column: str,
    row_number: int,
) -> bool:
    if isinstance(value, bool):
        return value

    if is_empty(value):
        raise ValueError(
            f"Dòng {row_number}: cột '{column}' không được để trống."
        )

    normalized = str(value).strip().lower()

    if normalized in {"true", "1", "có", "co", "yes", "y"}:
        return True

    if normalized in {"false", "0", "không", "khong", "no", "n"}:
        return False

    raise ValueError(
        f"Dòng {row_number}: cột '{column}' "
        "phải là TRUE/FALSE hoặc Có/Không."
    )


def validate_choice(
    value: str,
    allowed_values: set[str],
    column: str,
    row_number: int,
) -> str:
    if value not in allowed_values:
        choices = ", ".join(sorted(allowed_values))

        raise ValueError(
            f"Dòng {row_number}: cột '{column}' không hợp lệ; "
            f"chọn một trong {choices}."
        )

    return value