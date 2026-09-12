from fastapi import UploadFile
from sqlalchemy.orm import Session

from src.models.user_model import User
from src.schemas.import_schema import (
    ImportResponse,
)
from src.services.data_processing.import_service import (
    ImportService,
)


class ImportController:
    @staticmethod
    async def import_file(
        import_type: str,
        file: UploadFile,
        current_user: User,
        db: Session,
    ) -> ImportResponse:
        return await ImportService().import_file(
            import_type=import_type,
            file=file,
            current_user=current_user,
            db=db,
        )