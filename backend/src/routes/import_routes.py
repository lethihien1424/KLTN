from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
)
from sqlalchemy.orm import Session

from src.controllers.import_controller import (
    ImportController,
)
from src.core.database import get_db
from src.dependencies.auth_dependency import (
    get_current_user,
)
from src.models.user_model import User
from src.schemas.import_schema import (
    ImportResponse,
)


router = APIRouter(
    prefix="/imports",
    tags=["Import"],
)


async def execute_import(
    import_type: str,
    file: UploadFile,
    current_user: User,
    db: Session,
) -> ImportResponse:
    return await ImportController.import_file(
        import_type=import_type,
        file=file,
        current_user=current_user,
        db=db,
    )


@router.post(
    "/users",
    response_model=ImportResponse,
)
async def import_users(
    file: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return await execute_import(
        import_type="users",
        file=file,
        current_user=current_user,
        db=db,
    )


@router.post(
    "/san-pham",
    response_model=ImportResponse,
)
async def import_san_pham(
    file: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return await execute_import(
        import_type="san_pham",
        file=file,
        current_user=current_user,
        db=db,
    )


@router.post(
    "/nguyen-lieu",
    response_model=ImportResponse,
)
async def import_nguyen_lieu(
    file: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return await execute_import(
        import_type="nguyen_lieu",
        file=file,
        current_user=current_user,
        db=db,
    )


@router.post(
    "/nha-cung-cap",
    response_model=ImportResponse,
)
async def import_nha_cung_cap(
    file: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return await execute_import(
        import_type="nha_cung_cap",
        file=file,
        current_user=current_user,
        db=db,
    )


@router.post(
    "/nguyen-lieu-nha-cung-cap",
    response_model=ImportResponse,
)
async def import_nguyen_lieu_ncc(
    file: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return await execute_import(
        import_type=(
            "nguyen_lieu_nha_cung_cap"
        ),
        file=file,
        current_user=current_user,
        db=db,
    )


@router.post(
    "/ton-kho-nguyen-lieu",
    response_model=ImportResponse,
)
async def import_ton_kho_nguyen_lieu(
    file: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return await execute_import(
        import_type="ton_kho_nguyen_lieu",
        file=file,
        current_user=current_user,
        db=db,
    )


@router.post(
    "/ngay-le",
    response_model=ImportResponse,
)
async def import_ngay_le(
    file: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return await execute_import(
        import_type="ngay_le",
        file=file,
        current_user=current_user,
        db=db,
    )


@router.post(
    "/cong-thuc",
    response_model=ImportResponse,
)
async def import_cong_thuc(
    file: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return await execute_import(
        import_type="cong_thuc",
        file=file,
        current_user=current_user,
        db=db,
    )


@router.post(
    "/don-hang",
    response_model=ImportResponse,
)
async def import_don_hang(
    file: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return await execute_import(
        import_type="don_hang",
        file=file,
        current_user=current_user,
        db=db,
    )