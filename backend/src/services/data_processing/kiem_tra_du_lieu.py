### backend/src/services/data_processing/kiem_tra_du_lieu.py
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

import pandas as pd


def is_empty(value) -> bool:
    if value is None:
        return True

    if isinstance(value, str):
        return not value.strip()

    try:
        return bool(pd.isna(value))
    except (TypeError, ValueError):
        return False


def to_string(
    value,
    column: str,
    row_number: int,
    required: bool = True,
) -> str | None:
    if is_empty(value):
        if required:
            raise ValueError(
                f"Dòng {row_number}: '{column}' không được trống."
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
                f"Dòng {row_number}: '{column}' không được trống."
            )
        return None

    try:
        if isinstance(value, bool):
            raise ValueError("Boolean không phải số.")

        if isinstance(value, str):
            raw = value.strip()

            pattern = (
                r"[+-]?"
                r"(?:\d+|\d{1,3}(?:,\d{3})+)"
                r"(?:\.\d+)?"
            )

            if not re.fullmatch(pattern, raw):
                raise ValueError("Sai định dạng số.")

            value = raw.replace(",", "")

        result = Decimal(str(value))

        if not result.is_finite():
            raise ValueError("Số không hữu hạn.")

        return result

    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError(
            f"Dòng {row_number}: '{column}' phải là số hợp lệ."
        ) from exc


def to_integer(
    value,
    column: str,
    row_number: int,
) -> int:
    result = to_decimal(value, column, row_number)

    if result != result.to_integral_value():
        raise ValueError(
            f"Dòng {row_number}: '{column}' phải là số nguyên."
        )

    return int(result)


def to_date(
    value,
    column: str,
    row_number: int,
) -> date:
    if is_empty(value):
        raise ValueError(
            f"Dòng {row_number}: '{column}' không được trống."
        )

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    if isinstance(value, str):
        for pattern in (
            "%d/%m/%Y",
            "%d-%m-%Y",
            "%Y-%m-%d",
        ):
            try:
                return datetime.strptime(
                    value.strip(),
                    pattern,
                ).date()
            except ValueError:
                continue

    raise ValueError(
        f"Dòng {row_number}: '{column}' phải có định dạng "
        "DD/MM/YYYY, DD-MM-YYYY hoặc YYYY-MM-DD."
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
            f"Dòng {row_number}: '{column}' không được trống."
        )

    normalized = str(value).strip().lower()

    if normalized in {
        "true", "1", "1.0", "có", "co", "yes", "y",
    }:
        return True

    if normalized in {
        "false", "0", "0.0", "không", "khong", "no", "n",
    }:
        return False

    raise ValueError(
        f"Dòng {row_number}: '{column}' phải là TRUE/FALSE."
    )


def validate_choice(
    value: str,
    allowed_values: set[str],
    column: str,
    row_number: int,
) -> str:
    if value not in allowed_values:
        raise ValueError(
            f"Dòng {row_number}: '{column}' chỉ nhận "
            + ", ".join(sorted(allowed_values))
            + "."
        )

    return value