from pydantic import BaseModel


class ImportResponse(BaseModel):
    success: bool
    message: str
    total_rows: int
    imported_rows: int