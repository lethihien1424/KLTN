# ##D:\KLTN\KLTN\backend\src\routes\dashboard_routes.py
# from datetime import date
# from fastapi import APIRouter, Depends, HTTPException, Query
# from sqlalchemy.orm import Session

# from src.controllers.dashboard_controller import DashboardController
# from src.core.database import get_db
# from src.dependencies.permission_dependency import (
#     require_any_permission,
#     require_permission,
# )
# from src.schemas.dashboard_schema import (
#     AccountStatisticsResponse,
#     ConfigAuditStatsResponse,
#     DashboardInventoryAlert,
#     DashboardOverviewResponse,
#     DashboardSupplierPerformance,
#     FormulaBomStatsResponse,
#     InventoryAlertSummary,
#     InventoryStockStatsResponse,
#     MaterialDemandStatsResponse,
#     MaterialUsageResponse,
#     OrderStatsResponse,
#     ProductConsumptionResponse,
#     ProphetComparisonResponse,
#     PurchaseOrderStatsResponse,
#     SupplierMaterialsStatsResponse,
#     SupplierSuggestionStatsResponse,
# )


# router = APIRouter(prefix='/dashboard', tags=['Dashboard'])
# controller = DashboardController()


# @router.get(
#     '/tong-quan',
#     response_model=DashboardOverviewResponse,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('dashboard_mua_hang', 'XEM'),
#                 ('don_mua_nguyen_lieu', 'XEM'),
#                 ('tai_khoan', 'XEM'),
#             )
#         )
#     ],
# )
# def overview(db: Session = Depends(get_db)):
#     return controller.overview(db)


# # ==================== 1. NGUYÊN LIỆU SỬ DỤNG ====================
# @router.get(
#     '/nguyen-lieu-tieu-thu',
#     response_model=MaterialUsageResponse,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('nguyen_lieu', 'XEM'),
#                 ('don_mua_nguyen_lieu', 'XEM'),
#                 ('du_bao_nhu_cau', 'XEM'),
#                 ('dashboard_mua_hang', 'XEM'),
#             )
#         )
#     ],
# )
# def material_usage(
#     period_type: str = Query('thang', description='Loại kỳ: tuan | thang | nam'),
#     year: int | None = Query(None, description='Năm cần xem'),
#     month: int | None = Query(None, description='Tháng cần xem (1-12)'),
#     week: int | None = Query(None, description='Tuần cần xem (1-53)'),
#     db: Session = Depends(get_db),
# ):
#     return controller.material_usage(db, period_type, year, month, week)


# # ==================== 2. SẢN PHẨM TIÊU THỤ ====================
# @router.get(
#     '/san-pham-tieu-thu',
#     response_model=ProductConsumptionResponse,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('du_lieu_ban_hang', 'XEM'),
#                 ('san_pham', 'XEM'),
#                 ('du_bao_nhu_cau', 'XEM'),
#             )
#         )
#     ],
# )
# def product_consumption(
#     period_type: str = Query('thang', description='Loại kỳ: tuan | thang | nam'),
#     year: int | None = Query(None, description='Năm cần xem'),
#     month: int | None = Query(None, description='Tháng cần xem (1-12)'),
#     week: int | None = Query(None, description='Tuần cần xem (1-53)'),
#     db: Session = Depends(get_db),
# ):
#     return controller.product_consumption(db, period_type, year, month, week, from_date, to_date)


# # ==================== 3. SO SÁNH PROPHET ====================
# @router.get(
#     '/so-sanh-prophet',
#     response_model=ProphetComparisonResponse,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('du_bao_nhu_cau', 'XEM'),
#                 ('danh_gia_mo_hinh', 'XEM'),
#                 ('lich_su_du_bao', 'XEM'),
#             )
#         )
#     ],
# )
# def prophet_comparison(
#     from_date: date | None = Query(None, description='Từ ngày (YYYY-MM-DD)'),
#     to_date: date | None = Query(None, description='Đến ngày (YYYY-MM-DD)'),
#     ma_san_pham: str | None = Query(None, description='Lọc theo mã sản phẩm (optional)'),
#     db: Session = Depends(get_db),
# ):
#     return controller.prophet_comparison(db, from_date, to_date, ma_san_pham)


# # ==================== 4. NHÀ CUNG CẤP & ĐIỂM NCC ====================
# @router.get(
#     '/hieu-suat-nha-cung-cap',
#     response_model=list[DashboardSupplierPerformance],
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('hieu_suat_nha_cung_cap', 'XEM'),
#                 ('nha_cung_cap', 'XEM'),
#                 ('don_mua_nguyen_lieu', 'XEM'),
#                 ('dashboard_mua_hang', 'XEM'),
#                 ('du_bao_nhu_cau', 'XEM'),
#             )
#         )
#     ],
# )
# def supplier_performance(db: Session = Depends(get_db)):
#     return controller.supplier_performance(db)


# # ==================== 5. TRẠNG THÁI TÀI KHOẢN ====================
# @router.get(
#     '/thong-ke-tai-khoan',
#     response_model=AccountStatisticsResponse,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('tai_khoan', 'XEM'),
#                 ('phan_quyen', 'XEM'),
#                 ('don_mua_nguyen_lieu', 'XEM'),
#             )
#         )
#     ],
# )
# def account_statistics(db: Session = Depends(get_db)):
#     return controller.account_statistics(db)


# # ==================== 6. CẢNH BÁO TỒN KHO ====================
# @router.get(
#     '/canh-bao-ton-kho',
#     response_model=list[DashboardInventoryAlert],
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('ton_kho_nguyen_lieu', 'XEM'),
#                 ('don_mua_nguyen_lieu', 'XEM'),
#                 ('dashboard_mua_hang', 'XEM'),
#             )
#         )
#     ],
# )
# def inventory_alerts(db: Session = Depends(get_db)):
#     return controller.inventory_alerts(db)


# @router.get(
#     '/canh-bao-ton-kho-chi-tiet',
#     response_model=InventoryAlertSummary,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('ton_kho_nguyen_lieu', 'XEM'),
#                 ('don_mua_nguyen_lieu', 'XEM'),
#                 ('dashboard_mua_hang', 'XEM'),
#             )
#         )
#     ],
# )
# def inventory_alerts_detailed(db: Session = Depends(get_db)):
#     return controller.inventory_alerts_detailed(db)


# # ==================== ĐƠN HÀNG (DỮ LIỆU ĐƠN HÀNG) ====================
# @router.get(
#     '/don-hang',
#     response_model=OrderStatsResponse,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('du_lieu_ban_hang', 'XEM'),
#                 ('du_bao_nhu_cau', 'XEM'),
#                 ('san_pham', 'XEM'),
#             )
#         )
#     ],
# )
# def order_stats(
#     period_type: str = Query('thang', description='Loại kỳ: tuan | thang | nam'),
#     year: int | None = Query(None, description='Năm cần xem'),
#     month: int | None = Query(None, description='Tháng cần xem (1-12)'),
#     week: int | None = Query(None, description='Tuần cần xem (1-53)'),
#     db: Session = Depends(get_db),
# ):
#     return controller.order_stats(db, period_type, year, month, week)


# # ==================== CÔNG THỨC / BOM ====================
# @router.get(
#     '/cong-thuc-bom',
#     response_model=FormulaBomStatsResponse,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('cong_thuc', 'XEM'),
#             )
#         )
#     ],
# )
# def formula_bom_stats(db: Session = Depends(get_db)):
#     return controller.formula_bom_stats(db)


# # ==================== TỒN KHO & LƯỢNG ĐÃ BOOK ====================
# @router.get(
#     '/ton-kho-book',
#     response_model=InventoryStockStatsResponse,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('ton_kho_nguyen_lieu', 'XEM'),
#                 ('nhu_cau_nguyen_lieu', 'XEM'),
#                 ('don_mua_nguyen_lieu', 'XEM'),
#                 ('dashboard_mua_hang', 'XEM'),
#             )
#         )
#     ],
# )
# def inventory_stock_stats(db: Session = Depends(get_db)):
#     return controller.inventory_stock_stats(db)


# # ==================== NGUYÊN LIỆU CUNG ỨNG ====================
# @router.get(
#     '/nguyen-lieu-cung-ung',
#     response_model=SupplierMaterialsStatsResponse,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('nguyen_lieu_nha_cung_cap', 'XEM'),
#             )
#         )
#     ],
# )
# def supplier_materials_stats(db: Session = Depends(get_db)):
#     return controller.supplier_materials_stats(db)


# # ==================== GỢI Ý NHÀ CUNG CẤP ====================
# @router.get(
#     '/goi-y-nha-cung-cap',
#     response_model=SupplierSuggestionStatsResponse,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('goi_y_nha_cung_cap', 'XEM'),
#             )
#         )
#     ],
# )
# def supplier_suggestion_stats(db: Session = Depends(get_db)):
#     return controller.supplier_suggestion_stats(db)


# # ==================== NHU CẦU NGUYÊN LIỆU ====================
# @router.get(
#     '/nhu-cau-nguyen-lieu',
#     response_model=MaterialDemandStatsResponse,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('nhu_cau_nguyen_lieu', 'XEM'),
#                 ('don_mua_nguyen_lieu', 'XEM'),
#             )
#         )
#     ],
# )
# def material_demand_stats(db: Session = Depends(get_db)):
#     return controller.material_demand_stats(db)


# # ==================== ĐƠN MUA NGUYÊN LIỆU ====================
# @router.get(
#     '/don-mua-nguyen-lieu',
#     response_model=PurchaseOrderStatsResponse,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('don_mua_nguyen_lieu', 'XEM'),
#             )
#         )
#     ],
# )
# def purchase_order_stats(db: Session = Depends(get_db)):
#     return controller.purchase_order_stats(db)


# # ==================== CẤU HÌNH & NHẬT KÝ ====================
# @router.get(
#     '/cau-hinh-nhat-ky',
#     response_model=ConfigAuditStatsResponse,
#     dependencies=[
#         Depends(
#             require_any_permission(
#                 ('quan_ly_ly_do', 'XEM'),
#                 ('nhat_ky_hoat_dong', 'XEM'),
#             )
#         )
#     ],
# )
# def config_audit_stats(db: Session = Depends(get_db)):
#     return controller.config_audit_stats(db)

from datetime import date
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.controllers.dashboard_controller import DashboardController
from src.core.database import get_db
from src.dependencies.permission_dependency import (
    require_any_permission,
)
from src.schemas.dashboard_schema import (
    AccountStatisticsResponse,
    ConfigAuditStatsResponse,
    DashboardInventoryAlert,
    DashboardOverviewResponse,
    DashboardSupplierPerformance,
    FormulaBomStatsResponse,
    InventoryAlertSummary,
    InventoryStockStatsResponse,
    MaterialDemandStatsResponse,
    MaterialUsageResponse,
    OrderStatsResponse,
    ProductConsumptionResponse,
    ProphetComparisonResponse,
    PurchaseOrderStatsResponse,
    SupplierMaterialsStatsResponse,
    SupplierSuggestionStatsResponse,
)


router = APIRouter(prefix='/dashboard', tags=['Dashboard'])
controller = DashboardController()


@router.get(
    '/tong-quan',
    response_model=DashboardOverviewResponse,
    dependencies=[
        Depends(
            require_any_permission(
                ('dashboard_mua_hang', 'XEM'),
            )
        )
    ],
)
def overview(db: Session = Depends(get_db)):
    return controller.overview(db)


# ==================== 1. NGUYÊN LIỆU SỬ DỤNG ====================
@router.get(
    '/nguyen-lieu-tieu-thu',
    response_model=MaterialUsageResponse,
    dependencies=[
        Depends(
            require_any_permission(
                ('nguyen_lieu', 'XEM'),
                ('don_mua_nguyen_lieu', 'XEM'),
                ('ke_hoach_mua_hang', 'XEM'),
            )
        )
    ],
)
def material_usage(
    period_type: Literal["tuan", "thang", "nam"] = Query('thang', description='Loại kỳ: tuan | thang | nam'),
    year: int | None = Query(None, ge=1900, le=9998, description='Năm cần xem'),
    month: int | None = Query(None, ge=1, le=12, description='Tháng cần xem (1-12)'),
    week: int | None = Query(None, ge=1, le=53, description='Tuần ISO cần xem'),
    db: Session = Depends(get_db),
):
    return controller.material_usage(db, period_type, year, month, week)


# ==================== 2. SẢN PHẨM TIÊU THỤ ====================
@router.get(
    '/san-pham-tieu-thu',
    response_model=ProductConsumptionResponse,
    dependencies=[
        Depends(
            require_any_permission(
                ('dashboard_mua_hang', 'XEM'),
                ('san_pham', 'XEM'),
                ('du_lieu_ban_hang', 'XEM'),
                ('du_bao_nhu_cau', 'XEM'),
                ('lich_su_du_bao', 'XEM'),
                ('danh_gia_mo_hinh', 'XEM'),
                ('ton_kho_nguyen_lieu', 'XEM'),
                ('nhu_cau_nguyen_lieu', 'XEM'),
                ('don_mua_nguyen_lieu', 'XEM'),
                ('ke_hoach_mua_hang', 'XEM'),
            )
        )
    ],
)
def product_consumption(
    period_type: Literal["tuan", "thang", "nam"] = Query('thang', description='Loại kỳ: tuan | thang | nam'),
    year: int | None = Query(None, ge=1900, le=9998, description='Năm cần xem'),
    month: int | None = Query(None, ge=1, le=12, description='Tháng cần xem (1-12)'),
    week: int | None = Query(None, ge=1, le=53, description='Tuần ISO cần xem'),
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    db: Session = Depends(get_db),
):
    if (from_date is None) != (to_date is None):
        raise HTTPException(status_code=422, detail="Cần chọn đủ ngày bắt đầu và ngày kết thúc.")
    return controller.product_consumption(db, period_type, year, month, week, from_date, to_date)


# ==================== 3. SO SÁNH PROPHET ====================
@router.get(
    '/so-sanh-prophet',
    response_model=ProphetComparisonResponse,
    dependencies=[
        Depends(
            require_any_permission(
                ('du_bao_nhu_cau', 'XEM'),
                ('danh_gia_mo_hinh', 'XEM'),
                ('lich_su_du_bao', 'XEM'),
            )
        )
    ],
)
def prophet_comparison(
    from_date: date | None = Query(None, description='Từ ngày (YYYY-MM-DD)'),
    to_date: date | None = Query(None, description='Đến ngày (YYYY-MM-DD)'),
    ma_san_pham: str | None = Query(None, description='Lọc theo mã sản phẩm (optional)'),
    db: Session = Depends(get_db),
):
    return controller.prophet_comparison(db, from_date, to_date, ma_san_pham)


# ==================== 4. NHÀ CUNG CẤP & ĐIỂM NCC ====================
@router.get(
    '/hieu-suat-nha-cung-cap',
    response_model=list[DashboardSupplierPerformance],
    dependencies=[
        Depends(
            require_any_permission(
                ('dashboard_mua_hang', 'XEM'),
                ('nha_cung_cap', 'XEM'),
                ('hieu_suat_nha_cung_cap', 'XEM'),
                ('goi_y_nha_cung_cap', 'XEM'),
                ('nguyen_lieu_nha_cung_cap', 'XEM'),
            )
        )
    ],
)
def supplier_performance(db: Session = Depends(get_db)):
    return controller.supplier_performance(db)


# ==================== 5. TRẠNG THÁI TÀI KHOẢN ====================
@router.get(
    '/thong-ke-tai-khoan',
    response_model=AccountStatisticsResponse,
    dependencies=[
        Depends(
            require_any_permission(
                ('tai_khoan', 'XEM'),
                ('quan_ly_ly_do', 'XEM'),
                ('nhat_ky_hoat_dong', 'XEM'),
            )
        )
    ],
)
def account_statistics(db: Session = Depends(get_db)):
    return controller.account_statistics(db)


# ==================== 6. CẢNH BÁO TỒN KHO ====================
@router.get(
    '/canh-bao-ton-kho',
    response_model=list[DashboardInventoryAlert],
    dependencies=[
        Depends(
            require_any_permission(
                ('ton_kho_nguyen_lieu', 'XEM'),
                ('nhu_cau_nguyen_lieu', 'XEM'),
                ('don_mua_nguyen_lieu', 'XEM'),
                ('ke_hoach_mua_hang', 'XEM'),
            )
        )
    ],
)
def inventory_alerts(db: Session = Depends(get_db)):
    return controller.inventory_alerts(db)


@router.get(
    '/canh-bao-ton-kho-chi-tiet',
    response_model=InventoryAlertSummary,
    dependencies=[
        Depends(
            require_any_permission(
                ('ton_kho_nguyen_lieu', 'XEM'),
                ('nhu_cau_nguyen_lieu', 'XEM'),
                ('don_mua_nguyen_lieu', 'XEM'),
                ('ke_hoach_mua_hang', 'XEM'),
            )
        )
    ],
)
def inventory_alerts_detailed(db: Session = Depends(get_db)):
    return controller.inventory_alerts_detailed(db)


# ==================== ĐƠN HÀNG (DỮ LIỆU ĐƠN HÀNG) ====================
@router.get(
    '/don-hang',
    response_model=OrderStatsResponse,
    dependencies=[
        Depends(
            require_any_permission(
                ('dashboard_mua_hang', 'XEM'),
                ('du_lieu_ban_hang', 'XEM'),
                ('du_bao_nhu_cau', 'XEM'),
            )
        )
    ],
)
def order_stats(
    period_type: Literal["tuan", "thang", "nam"] = Query('thang', description='Loại kỳ: tuan | thang | nam'),
    year: int | None = Query(None, ge=1900, le=9998, description='Năm cần xem'),
    month: int | None = Query(None, ge=1, le=12, description='Tháng cần xem (1-12)'),
    week: int | None = Query(None, ge=1, le=53, description='Tuần ISO cần xem'),
    db: Session = Depends(get_db),
):
    return controller.order_stats(db, period_type, year, month, week)


# ==================== CÔNG THỨC / BOM ====================
@router.get(
    '/cong-thuc-bom',
    response_model=FormulaBomStatsResponse,
    dependencies=[
        Depends(
            require_any_permission(
                ('cong_thuc', 'XEM'),
            )
        )
    ],
)
def formula_bom_stats(db: Session = Depends(get_db)):
    return controller.formula_bom_stats(db)


# ==================== TỒN KHO & LƯỢNG ĐÃ BOOK ====================
@router.get(
    '/ton-kho-book',
    response_model=InventoryStockStatsResponse,
    dependencies=[
        Depends(
            require_any_permission(
                ('dashboard_mua_hang', 'XEM'),
                ('ton_kho_nguyen_lieu', 'XEM'),
                ('nhu_cau_nguyen_lieu', 'XEM'),
                ('don_mua_nguyen_lieu', 'XEM'),
                ('ke_hoach_mua_hang', 'XEM'),
                ('du_bao_nhu_cau', 'XEM'),
                ('lich_su_du_bao', 'XEM'),
            )
        )
    ],
)
def inventory_stock_stats(db: Session = Depends(get_db)):
    return controller.inventory_stock_stats(db)


# ==================== NGUYÊN LIỆU CUNG ỨNG ====================
@router.get(
    '/nguyen-lieu-cung-ung',
    response_model=SupplierMaterialsStatsResponse,
    dependencies=[
        Depends(
            require_any_permission(
                ('dashboard_mua_hang', 'XEM'),
                ('nguyen_lieu_nha_cung_cap', 'XEM'),
                ('nha_cung_cap', 'XEM'),
                ('hieu_suat_nha_cung_cap', 'XEM'),
                ('du_bao_nhu_cau', 'XEM'),
                ('lich_su_du_bao', 'XEM'),
                ('don_mua_nguyen_lieu', 'XEM'),
                ('ke_hoach_mua_hang', 'XEM'),
            )
        )
    ],
)
def supplier_materials_stats(db: Session = Depends(get_db)):
    return controller.supplier_materials_stats(db)


# ==================== GỢI Ý NHÀ CUNG CẤP ====================
@router.get(
    '/goi-y-nha-cung-cap',
    response_model=SupplierSuggestionStatsResponse,
    dependencies=[
        Depends(
            require_any_permission(
                ('goi_y_nha_cung_cap', 'XEM'),
            )
        )
    ],
)
def supplier_suggestion_stats(db: Session = Depends(get_db)):
    return controller.supplier_suggestion_stats(db)


# ==================== NHU CẦU NGUYÊN LIỆU ====================
@router.get(
    '/nhu-cau-nguyen-lieu',
    response_model=MaterialDemandStatsResponse,
    dependencies=[
        Depends(
            require_any_permission(
                ('dashboard_mua_hang', 'XEM'),
                ('nguyen_lieu', 'XEM'),
                ('ton_kho_nguyen_lieu', 'XEM'),
                ('nhu_cau_nguyen_lieu', 'XEM'),
                ('don_mua_nguyen_lieu', 'XEM'),
                ('ke_hoach_mua_hang', 'XEM'),
                ('du_bao_nhu_cau', 'XEM'),
                ('lich_su_du_bao', 'XEM'),
            )
        )
    ],
)
def material_demand_stats(db: Session = Depends(get_db)):
    return controller.material_demand_stats(db)


# ==================== ĐƠN MUA NGUYÊN LIỆU ====================
@router.get(
    '/don-mua-nguyen-lieu',
    response_model=PurchaseOrderStatsResponse,
    dependencies=[
        Depends(
            require_any_permission(
                ('dashboard_mua_hang', 'XEM'),
                ('don_mua_nguyen_lieu', 'XEM'),
                ('ke_hoach_mua_hang', 'XEM'),
            )
        )
    ],
)
def purchase_order_stats(db: Session = Depends(get_db)):
    return controller.purchase_order_stats(db)


# ==================== CẤU HÌNH & NHẬT KÝ ====================
@router.get(
    '/cau-hinh-nhat-ky',
    response_model=ConfigAuditStatsResponse,
    dependencies=[
        Depends(
            require_any_permission(
                ('quan_ly_ly_do', 'XEM'),
                ('nhat_ky_hoat_dong', 'XEM'),
            )
        )
    ],
)
def config_audit_stats(db: Session = Depends(get_db)):
    return controller.config_audit_stats(db)


