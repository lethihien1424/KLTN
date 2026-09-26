from fastapi import APIRouter
from src.routes.don_mua_routes import router as don_mua_router
from src.routes.don_mua_routes import receipt_router as don_mua_receipt_router
from src.routes.cong_thuc_routes import router as cong_thuc_router
from src.routes.nguyen_lieu_routes import router as nguyen_lieu_router
from src.routes.ton_kho_routes import router as ton_kho_router
from src.routes.nha_cung_cap_routes import router as nha_cung_cap_router
from src.routes.nguyen_lieu_nha_cung_cap_routes import router as nguyen_lieu_ncc_router
from src.routes.nhu_cau_nguyen_lieu_routes import router as nhu_cau_nguyen_lieu_router
from src.routes.goi_y_nha_cung_cap_routes import router as goi_y_nha_cung_cap_router
from src.routes.de_xuat_nhap_hang_routes import router as de_xuat_nhap_hang_router
from src.routes.dashboard_routes import router as dashboard_router

from src.routes.auth_routes import (
    router as auth_router,
)
from src.routes.import_routes import (
    router as import_router,
)


api_router = APIRouter(
    prefix="/api",
)


api_router.include_router(
    auth_router
)

api_router.include_router(
    import_router
)

api_router.include_router(nguyen_lieu_router)
api_router.include_router(cong_thuc_router)
api_router.include_router(ton_kho_router)
api_router.include_router(nha_cung_cap_router)
api_router.include_router(nguyen_lieu_ncc_router)
api_router.include_router(don_mua_router)
api_router.include_router(don_mua_receipt_router)
api_router.include_router(nhu_cau_nguyen_lieu_router)
api_router.include_router(goi_y_nha_cung_cap_router)
api_router.include_router(de_xuat_nhap_hang_router)
api_router.include_router(dashboard_router)
