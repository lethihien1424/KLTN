# ##D:\KLTN\KLTN\backend\src\routes\nguyen_lieu_routes.py
# from fastapi import APIRouter, Depends, Query
# from sqlalchemy.orm import Session

# from src.controllers.nguyen_lieu_controller import NguyenLieuController
# from src.core.database import get_db
# from src.dependencies.permission_dependency import require_permission
# from src.schemas.nguyen_lieu_schema import (
#     NguyenLieuCreate, NguyenLieuResponse, NguyenLieuStatusUpdate,
#     NguyenLieuUpdate, TrangThaiNguyenLieu,
# )


# router = APIRouter(prefix='/nguyen-lieu', tags=['Nguyên liệu'])

# controller = NguyenLieuController()


# @router.get('', response_model=list[NguyenLieuResponse], dependencies=[Depends(require_permission('NGUYEN_LIEU_VIEW'))])
# def list_nguyen_lieu(
#     search: str | None = Query(default=None),
#     trang_thai: TrangThaiNguyenLieu | None = Query(default=None),
#     db: Session = Depends(get_db),
# ):
#     return controller.list(db, search, trang_thai)


# @router.get('/{ma_nguyen_lieu}', response_model=NguyenLieuResponse, dependencies=[Depends(require_permission('NGUYEN_LIEU_VIEW'))])
# def get_nguyen_lieu(ma_nguyen_lieu: str, db: Session = Depends(get_db)):
#     return controller.get(db, ma_nguyen_lieu)


# @router.post('', response_model=NguyenLieuResponse, status_code=201, dependencies=[Depends(require_permission('NGUYEN_LIEU_CREATE'))])
# def create_nguyen_lieu(payload: NguyenLieuCreate, db: Session = Depends(get_db)):
#     return controller.create(db, payload)


# @router.put('/{ma_nguyen_lieu}', response_model=NguyenLieuResponse, dependencies=[Depends(require_permission('NGUYEN_LIEU_UPDATE'))])
# def update_nguyen_lieu(
#     ma_nguyen_lieu: str, payload: NguyenLieuUpdate, db: Session = Depends(get_db),
# ):
#     return controller.update(db, ma_nguyen_lieu, payload)


# @router.patch('/{ma_nguyen_lieu}/trang-thai', response_model=NguyenLieuResponse, dependencies=[Depends(require_permission('NGUYEN_LIEU_CHANGE_STATUS'))])
# def update_trang_thai(
#     ma_nguyen_lieu: str, payload: NguyenLieuStatusUpdate, actor=Depends(require_permission("NGUYEN_LIEU_CHANGE_STATUS")), db: Session = Depends(get_db),
# ):
#     return controller.update_status(db, ma_nguyen_lieu, payload, actor.ma_nguoi_dung)

## D:\KLTN\KLTN\backend\src\routes\nguyen_lieu_routes.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.controllers.nguyen_lieu_controller import (
    NguyenLieuController,
)
from src.core.database import get_db
from src.dependencies.permission_dependency import (
    require_permission,
)
from src.models.user_model import User
from src.schemas.nguyen_lieu_schema import (
    NguyenLieuCreate,
    NguyenLieuResponse,
    NguyenLieuStatusUpdate,
    NguyenLieuUpdate,
    TrangThaiNguyenLieu,
)


router = APIRouter(
    prefix="/nguyen-lieu",
    tags=["Nguyên liệu"],
)

controller = NguyenLieuController()


@router.get(
    "",
    response_model=list[NguyenLieuResponse],
    dependencies=[
        Depends(require_permission("nguyen_lieu", "XEM"))
    ],
)
def list_nguyen_lieu(
    search: str | None = Query(default=None),
    trang_thai: TrangThaiNguyenLieu | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return controller.list(
        db,
        search,
        trang_thai,
    )


@router.get(
    "/{ma_nguyen_lieu}",
    response_model=NguyenLieuResponse,
    dependencies=[
        Depends(require_permission("nguyen_lieu", "XEM"))
    ],
)
def get_nguyen_lieu(
    ma_nguyen_lieu: str,
    db: Session = Depends(get_db),
):
    return controller.get(
        db,
        ma_nguyen_lieu,
    )


@router.post(
    "",
    response_model=NguyenLieuResponse,
    status_code=201,
    dependencies=[
        Depends(require_permission("nguyen_lieu", "THEM"))
    ],
)
def create_nguyen_lieu(
    payload: NguyenLieuCreate,
    db: Session = Depends(get_db),
):
    return controller.create(
        db,
        payload,
    )


@router.put(
    "/{ma_nguyen_lieu}",
    response_model=NguyenLieuResponse,
    dependencies=[
        Depends(require_permission("nguyen_lieu", "SUA"))
    ],
)
def update_nguyen_lieu(
    ma_nguyen_lieu: str,
    payload: NguyenLieuUpdate,
    db: Session = Depends(get_db),
):
    return controller.update(
        db,
        ma_nguyen_lieu,
        payload,
    )


@router.patch(
    "/{ma_nguyen_lieu}/trang-thai",
    response_model=NguyenLieuResponse,
)
def update_trang_thai(
    ma_nguyen_lieu: str,
    payload: NguyenLieuStatusUpdate,
    actor: User = Depends(
        require_permission("nguyen_lieu", "SUA")
    ),
    db: Session = Depends(get_db),
):
    return controller.update_status(
        db,
        ma_nguyen_lieu,
        payload,
        actor.ma_nguoi_dung,
    )