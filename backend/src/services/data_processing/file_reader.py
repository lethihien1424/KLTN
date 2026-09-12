from io import BytesIO
from pathlib import Path

import pandas as pd
from fastapi import (
    HTTPException,
    UploadFile,
    status,
)


MAX_FILE_SIZE = 10 * 1024 * 1024


async def read_upload_file(
    file: UploadFile,
) -> tuple[pd.DataFrame, list[str]]:
    filename = (
        file.filename or ""
    ).strip()

    extension = Path(
        filename
    ).suffix.lower()

    if extension not in {
        ".xlsx",
        ".csv",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Chỉ cho phép upload file "
                "Excel (.xlsx) hoặc CSV (.csv)."
            ),
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File không có dữ liệu.",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Dung lượng file tối đa là 10 MB."
            ),
        )

    try:
        if extension == ".xlsx":
            excel = pd.ExcelFile(
                BytesIO(content),
                engine="openpyxl",
            )

            sheet_names = excel.sheet_names

            dataframe = pd.read_excel(
                BytesIO(content),
                sheet_name=sheet_names[0],
                engine="openpyxl",
                dtype=object,
            )

        else:
            sheet_names = []

            dataframe = pd.read_csv(
                BytesIO(content),
                encoding="utf-8-sig",
                dtype=object,
            )

    except UnicodeDecodeError:
        try:
            dataframe = pd.read_csv(
                BytesIO(content),
                encoding="utf-8",
                dtype=object,
            )

            sheet_names = []

        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Không thể đọc file CSV."
                ),
            ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Không thể đọc file Excel hoặc CSV."
            ),
        ) from exc

    if dataframe.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "File không có dòng dữ liệu."
            ),
        )

    dataframe.columns = [
        str(column).strip()
        for column in dataframe.columns
    ]

    dataframe = dataframe.dropna(
        how="all"
    )

    if dataframe.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "File không có dòng dữ liệu."
            ),
        )

    dataframe["_row_number"] = (
        dataframe.index + 2
    )

    return dataframe, sheet_names