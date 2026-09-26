###D:\KLTN\KLTN\backend\src\services\data_processing\template_validator.py
import pandas as pd
from fastapi import (
    HTTPException,
    status,
)


def validate_sheet(
    actual_sheets: list[str],
    expected_sheets: set[str],
) -> None:
    if not expected_sheets.issubset(
        set(actual_sheets)
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail={
                "message": "Tên sheet không đúng.",
                "sheet_bat_buoc": sorted(
                    expected_sheets
                ),
                "sheet_hien_tai": actual_sheets,
            },
        )


def validate_headers(
    dataframe: pd.DataFrame,
    expected_headers: set[str],
) -> None:
    actual_headers = set(
        dataframe.columns
    )

    actual_headers.discard(
        "_row_number"
    )

    missing_headers = (
        expected_headers
        - actual_headers
    )

    extra_headers = (
        actual_headers
        - expected_headers
    )

    if missing_headers or extra_headers:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail={
                "message": (
                    "File không đúng template."
                ),
                "thieu_cot": sorted(
                    missing_headers
                ),
                "du_cot": sorted(
                    extra_headers
                ),
            },
        )


def validate_columns(
    dataframe: pd.DataFrame,
    required_columns: set[str],
    optional_columns: set[str] | None = None,
) -> None:
    optional_columns = (
        optional_columns or set()
    )

    actual_columns = set(
        dataframe.columns
    )

    actual_columns.discard(
        "_row_number"
    )

    allowed_columns = (
        required_columns
        | optional_columns
    )

    missing_columns = (
        required_columns
        - actual_columns
    )

    extra_columns = (
        actual_columns
        - allowed_columns
    )

    if missing_columns or extra_columns:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail={
                "message": (
                    "File không đúng cấu trúc "
                    "template."
                ),
                "thieu_cot": sorted(
                    missing_columns
                ),
                "du_cot": sorted(
                    extra_columns
                ),
            },
        )


def require_value(
    row: dict,
    column: str,
    row_number: int,
):
    value = row.get(
        column
    )

    if pd.isna(value):
        raise ValueError(
            f"Dòng {row_number}: "
            f"{column} không được để trống."
        )

    if (
        isinstance(value, str)
        and not value.strip()
    ):
        raise ValueError(
            f"Dòng {row_number}: "
            f"{column} không được để trống."
        )

    return value