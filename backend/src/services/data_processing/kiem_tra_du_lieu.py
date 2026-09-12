from datetime import (
    date,
    datetime,
)
from decimal import (
    Decimal,
    InvalidOperation,
)

import pandas as pd


def is_empty(
    value,
) -> bool:
    if value is None:
        return True

    try:
        if pd.isna(value):
            return True
    except (TypeError, ValueError):
        pass

    if (
        isinstance(value, str)
        and not value.strip()
    ):
        return True

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
                f"Dòng {row_number}: "
                f"cột '{column}' "
                "không được để trống."
            )

        return None

    value = str(
        value
    ).strip()

    return value


def to_decimal(
    value,
    column: str,
    row_number: int,
    required: bool = True,
) -> Decimal | None:
    if is_empty(value):
        if required:
            raise ValueError(
                f"Dòng {row_number}: "
                f"cột '{column}' "
                "không được để trống."
            )

        return None

    try:
        if isinstance(
            value,
            str,
        ):
            value = (
                value
                .strip()
                .replace(",", "")
            )

        return Decimal(
            str(value)
        )

    except (
        InvalidOperation,
        ValueError,
        TypeError,
    ) as exc:
        raise ValueError(
            f"Dòng {row_number}: "
            f"cột '{column}' "
            "phải là số. "
            f"Giá trị hiện tại: {value}"
        ) from exc


def to_integer(
    value,
    column: str,
    row_number: int,
) -> int:
    decimal_value = to_decimal(
        value=value,
        column=column,
        row_number=row_number,
    )

    if decimal_value is None:
        raise ValueError(
            f"Dòng {row_number}: "
            f"cột '{column}' "
            "không được để trống."
        )

    if (
        decimal_value
        != decimal_value.to_integral_value()
    ):
        raise ValueError(
            f"Dòng {row_number}: "
            f"cột '{column}' "
            "phải là số nguyên."
        )

    return int(
        decimal_value
    )


def to_date(
    value,
    column: str,
    row_number: int,
) -> date:
    if is_empty(value):
        raise ValueError(
            f"Dòng {row_number}: "
            f"cột '{column}' "
            "không được để trống."
        )

    if isinstance(
        value,
        datetime,
    ):
        return value.date()

    if isinstance(
        value,
        date,
    ):
        return value

    try:
        parsed = pd.to_datetime(
            value,
            dayfirst=True,
            errors="raise",
        )

        return parsed.date()

    except Exception as exc:
        raise ValueError(
            f"Dòng {row_number}: "
            f"cột '{column}' "
            "không đúng định dạng ngày."
        ) from exc


def to_boolean(
    value,
    column: str,
    row_number: int,
) -> bool:
    if isinstance(
        value,
        bool,
    ):
        return value

    if is_empty(value):
        raise ValueError(
            f"Dòng {row_number}: "
            f"cột '{column}' "
            "không được để trống."
        )

    normalized = str(
        value
    ).strip().lower()

    true_values = {
        "true",
        "1",
        "có",
        "co",
        "yes",
        "y",
    }

    false_values = {
        "false",
        "0",
        "không",
        "khong",
        "no",
        "n",
    }

    if normalized in true_values:
        return True

    if normalized in false_values:
        return False

    raise ValueError(
        f"Dòng {row_number}: "
        f"cột '{column}' "
        "phải là TRUE/FALSE "
        "hoặc Có/Không."
    )


def validate_choice(
    value: str,
    allowed_values: set[str],
    column: str,
    row_number: int,
) -> str:
    if value not in allowed_values:
        raise ValueError(
            f"Dòng {row_number}: "
            f"cột '{column}' "
            f"có giá trị '{value}' "
            "không hợp lệ. "
            "Giá trị được phép: "
            + ", ".join(
                sorted(
                    allowed_values
                )
            )
        )

    return value