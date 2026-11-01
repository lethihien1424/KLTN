# ###D:\KLTN\KLTN\backend\src\schemas\dashboard_schema.py
# from datetime import date
# from decimal import Decimal

# from pydantic import BaseModel, field_serializer


# class DashboardMaterialSummary(BaseModel):
#     tong_so: int
#     duoi_ton_an_toan: int


# class DashboardPurchaseValues(BaseModel):
#     gia_tri_da_duyet: Decimal
#     gia_tri_da_nhan_hang: Decimal

#     @field_serializer("gia_tri_da_duyet", "gia_tri_da_nhan_hang")
#     def serialize_money(self, value: Decimal):
#         return format(value, ".2f")


# class DashboardSupplierSummary(BaseModel):
#     tong_so: int
#     co_du_lieu_hieu_suat_thuc_te: int


# class DashboardOverviewResponse(BaseModel):
#     nguyen_lieu: DashboardMaterialSummary
#     de_xuat_nhap_hang: dict[str, int]
#     don_mua: dict[str, int]
#     mua_hang: DashboardPurchaseValues
#     nha_cung_cap: DashboardSupplierSummary


# class DashboardInventoryAlert(BaseModel):
#     ma_nguyen_lieu: str
#     ten_nguyen_lieu: str
#     don_vi_do_luong: str
#     ngay_ghi_nhan: date
#     ton_kho_thuc_te: Decimal
#     so_luong_book: Decimal
#     ton_kho_kha_dung: Decimal
#     ton_kho_an_toan: Decimal
#     so_luong_thieu_an_toan: Decimal
#     muc_do_canh_bao: str = "CANH_BAO"

#     @field_serializer(
#         "ton_kho_thuc_te", "so_luong_book", "ton_kho_kha_dung",
#         "ton_kho_an_toan", "so_luong_thieu_an_toan",
#     )
#     def serialize_quantity(self, value: Decimal):
#         return format(value, ".2f")


# class InventoryAlertSummary(BaseModel):
#     tong_so_nguyen_lieu: int
#     duoi_ton_an_toan: int
#     khan_cap: int
#     canh_bao: int
#     an_toan: int
#     ty_le_an_toan: float
#     items: list[DashboardInventoryAlert]


# class DashboardSupplierPerformance(BaseModel):
#     ma_ncc: str
#     ten_ncc: str
#     diem_ncc: Decimal | None
#     ty_le_giao_dung_han_thuc_te: Decimal | None
#     ty_le_giao_du_thuc_te: Decimal | None
#     xep_loai: str = "TRUNG_BINH"

#     @field_serializer(
#         "diem_ncc", "ty_le_giao_dung_han_thuc_te", "ty_le_giao_du_thuc_te"
#     )
#     def serialize_score(self, value: Decimal | None):
#         return None if value is None else format(value, ".2f")


# # ==================== 1. NGUYÊN LIỆU SỬ DỤNG ====================
# class MaterialUsageItem(BaseModel):
#     ma_nguyen_lieu: str
#     ten_nguyen_lieu: str
#     don_vi_do_luong: str
#     so_luong_su_dung: float
#     ty_le_phan_tram: float


# class MaterialUsageSummary(BaseModel):
#     tong_luong_su_dung: float
#     so_loai_nguyen_lieu: int
#     nguyen_lieu_dung_nhieu_nhat: MaterialUsageItem | None
#     nguyen_lieu_dung_it_nhat: MaterialUsageItem | None


# class MaterialUsageResponse(BaseModel):
#     period_type: str
#     period_label: str
#     start_date: date
#     end_date: date
#     top_used: list[MaterialUsageItem]
#     least_used: list[MaterialUsageItem]
#     all_materials: list[MaterialUsageItem]
#     summary: MaterialUsageSummary


# # ==================== 2. SẢN PHẨM TIÊU THỤ ====================
# class ProductConsumptionItem(BaseModel):
#     ma_san_pham: str
#     ten_san_pham: str
#     don_vi_tinh: str
#     so_luong_ban: int
#     doanh_thu: float
#     so_don_hang: int
#     ty_le_phan_tram: float


# class ProductConsumptionSummary(BaseModel):
#     tong_so_luong: int
#     tong_doanh_thu: float
#     tong_don_hang: int
#     so_loai_san_pham: int
#     san_pham_ban_chay_nhat: ProductConsumptionItem | None
#     san_pham_ban_it_nhat: ProductConsumptionItem | None


# class ProductConsumptionResponse(BaseModel):
#     period_type: str
#     period_label: str
#     start_date: date
#     end_date: date
#     top_products: list[ProductConsumptionItem]
#     least_products: list[ProductConsumptionItem]
#     all_products: list[ProductConsumptionItem]
#     summary: ProductConsumptionSummary


# # ==================== 3. SO SÁNH PROPHET VS THỰC TẾ ====================
# class ProphetComparisonItem(BaseModel):
#     nhan_thoi_gian: str
#     tu_ngay: date
#     den_ngay: date
#     thuc_te: int
#     du_bao_prophet: int
#     can_duoi: int | None
#     can_tren: int | None
#     chenh_lech: int
#     phan_tram_lech: float
#     danh_gia: str


# class ProphetProductComparisonItem(BaseModel):
#     ma_san_pham: str
#     ten_san_pham: str
#     thuc_te: int
#     du_bao_prophet: int
#     chenh_lech: int
#     phan_tram_lech: float


# class ProphetComparisonSummary(BaseModel):
#     tong_thuc_te: int
#     tong_prophet: int
#     tong_chenh_lech: int
#     phan_tram_lech_tong: float
#     mae: float
#     mape: float


# class ProphetComparisonResponse(BaseModel):
#     tu_ngay: date
#     den_ngay: date
#     ma_san_pham: str | None
#     periods: list[ProphetComparisonItem]
#     products: list[ProphetProductComparisonItem]
#     summary: ProphetComparisonSummary


# # ==================== 5. TRẠNG THÁI TÀI KHOẢN ====================
# class RoleGroupStat(BaseModel):
#     vai_tro: str
#     label: str
#     so_luong: int
#     ty_le: float


# class AccountStatisticsResponse(BaseModel):
#     tong_tai_khoan: int
#     dang_hoat_dong: int
#     ngung_hoat_dong: int
#     ty_le_hoat_dong: float
#     vai_tro_distribution: list[RoleGroupStat]


# # ==================== THỐNG KÊ ĐƠN HÀNG (DỮ LIỆU ĐƠN HÀNG) ====================
# class OrderDetailStatItem(BaseModel):
#     ma_don_hang: str
#     ngay_ban: date | None
#     tong_so_luong: int
#     tong_gia_tri: float
#     so_mat_hang: int


# class OrderTimelineStat(BaseModel):
#     nhan_thoi_gian: str
#     so_don_hang: int
#     tong_so_luong: int
#     tong_gia_tri: float


# class OrderStatsSummary(BaseModel):
#     tong_so_don_hang: int
#     tong_so_luong_ban: int
#     tong_doanh_thu: float
#     gia_tri_trung_binh_don: float
#     don_hang_lon_nhat: OrderDetailStatItem | None
#     don_hang_nho_nhat: OrderDetailStatItem | None


# class OrderStatsResponse(BaseModel):
#     period_type: str
#     period_label: str
#     start_date: date
#     end_date: date
#     top_orders: list[OrderDetailStatItem]
#     least_orders: list[OrderDetailStatItem]
#     timeline: list[OrderTimelineStat]
#     summary: OrderStatsSummary


# # ==================== CÔNG THỨC / BOM ====================
# class FormulaMaterialUsageItem(BaseModel):
#     ma_nguyen_lieu: str
#     ten_nguyen_lieu: str
#     don_vi_do_luong: str
#     so_cong_thuc_tham_gia: int
#     ty_le_phoi_tron_tb: float
#     trang_thai: str


# class FormulaBomStatsResponse(BaseModel):
#     tong_so_cong_thuc: int
#     tong_so_nguyen_lieu: int
#     nguyen_lieu_trong_bom: int
#     nguyen_lieu_chua_dung: int
#     top_materials: list[FormulaMaterialUsageItem]
#     least_materials: list[FormulaMaterialUsageItem]
#     unused_materials: list[FormulaMaterialUsageItem]


# # ==================== TỒN KHO & LƯỢNG ĐÃ BOOK ====================
# class InventoryStockItem(BaseModel):
#     ma_nguyen_lieu: str
#     ten_nguyen_lieu: str
#     don_vi_do_luong: str
#     so_luong_book: float
#     ton_kho_thuc_te: float
#     ton_kho_kha_dung: float
#     ton_kho_an_toan: float
#     so_luong_thieu_an_toan: float
#     muc_do_canh_bao: str


# class InventoryStockStatsResponse(BaseModel):
#     tong_nguyen_lieu: int
#     tong_luong_book: float
#     tong_ton_thuc_te: float
#     top_booked: list[InventoryStockItem]
#     least_booked: list[InventoryStockItem]
#     top_actual_stock: list[InventoryStockItem]
#     least_actual_stock: list[InventoryStockItem]
#     alerts: list[InventoryStockItem]


# # ==================== NGUYÊN LIỆU CUNG ỨNG ====================
# class SupplierMaterialDetailItem(BaseModel):
#     ma_nguyen_lieu: str
#     ten_nguyen_lieu: str
#     ma_ncc: str
#     ten_ncc: str
#     don_gia: float
#     lead_time_ngay: int
#     ty_le_chat_luong_dat: float
#     ty_le_giao_dung_han: float
#     ty_le_giao_du: float


# class SupplierSummaryByMaterial(BaseModel):
#     ma_nguyen_lieu: str
#     ten_nguyen_lieu: str
#     so_nha_cung_cap: int
#     don_gia_thap_nhat: float
#     don_gia_cao_nhat: float


# class SupplierMaterialsStatsResponse(BaseModel):
#     top_supplied_materials: list[SupplierSummaryByMaterial]
#     least_supplied_materials: list[SupplierSummaryByMaterial]
#     highest_price_items: list[SupplierMaterialDetailItem]
#     lowest_price_items: list[SupplierMaterialDetailItem]
#     best_quality_items: list[SupplierMaterialDetailItem]
#     worst_quality_items: list[SupplierMaterialDetailItem]
#     best_ontime_items: list[SupplierMaterialDetailItem]
#     worst_ontime_items: list[SupplierMaterialDetailItem]


# # ==================== GỢI Ý NHÀ CUNG CẤP ====================
# class SuggestedSupplierItem(BaseModel):
#     ma_ncc: str
#     ten_ncc: str
#     so_lan_goi_y_top1: int
#     so_nguyen_lieu_cung_ung: int
#     diem_ncc: float | None
#     ty_le_dung_han: float | None
#     trang_thai_goi_y: str


# class SupplierSuggestionStatsResponse(BaseModel):
#     tong_ncc: int
#     so_ncc_duoc_goi_y: int
#     so_ncc_khong_goi_y: int
#     top_suggested: list[SuggestedSupplierItem]
#     least_suggested: list[SuggestedSupplierItem]
#     not_suggested: list[SuggestedSupplierItem]


# # ==================== NHU CẦU NGUYÊN LIỆU ====================
# class MaterialDemandItem(BaseModel):
#     ma_nguyen_lieu: str
#     ten_nguyen_lieu: str
#     don_vi_do_luong: str
#     nhu_cau: float
#     ton_kho_kha_dung: float
#     ton_kho_an_toan: float
#     luong_can_mua: float


# class MaterialDemandStatsResponse(BaseModel):
#     tong_nhu_cau: float
#     tong_can_mua: float
#     top_demand: list[MaterialDemandItem]
#     least_demand: list[MaterialDemandItem]
#     all_demand: list[MaterialDemandItem]


# # ==================== ĐƠN MUA NGUYÊN LIỆU ====================
# class PurchaseOrderMaterialStat(BaseModel):
#     ma_nguyen_lieu: str
#     ten_nguyen_lieu: str
#     don_vi_do_luong: str
#     so_luong_mua: float
#     tong_gia_tri: float
#     so_don_mua: int


# class PurchaseOrderStatsResponse(BaseModel):
#     tong_gia_tri_mua: float
#     tong_so_don_mua: int
#     top_purchased: list[PurchaseOrderMaterialStat]
#     least_purchased: list[PurchaseOrderMaterialStat]
#     all_purchased: list[PurchaseOrderMaterialStat]


# # ==================== CẤU HÌNH & NHẬT KÝ ====================
# class AuditUserStat(BaseModel):
#     ten_nguoi_thao_tac: str
#     so_lan: int


# class AuditFeatureStat(BaseModel):
#     chuc_nang: str
#     so_lan: int


# class ConfigAuditStatsResponse(BaseModel):
#     tong_nhat_ky: int
#     top_users: list[AuditUserStat]
#     top_features: list[AuditFeatureStat]
#     ty_le_thanh_cong: float

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, field_serializer


# ==================== TỔNG QUAN ====================

class DashboardMaterialSummary(BaseModel):
    tong_so: int
    duoi_ton_an_toan: int


class DashboardPurchaseValues(BaseModel):
    gia_tri_da_duyet: Decimal
    gia_tri_da_nhan_hang: Decimal

    @field_serializer(
        "gia_tri_da_duyet",
        "gia_tri_da_nhan_hang",
    )
    def serialize_money(self, value: Decimal) -> str:
        return format(value, ".2f")


class DashboardSupplierSummary(BaseModel):
    tong_so: int
    co_du_lieu_hieu_suat_thuc_te: int


class DashboardOverviewResponse(BaseModel):
    nguyen_lieu: DashboardMaterialSummary
    de_xuat_nhap_hang: dict[str, int]
    don_mua: dict[str, int]
    mua_hang: DashboardPurchaseValues
    nha_cung_cap: DashboardSupplierSummary


# ==================== CẢNH BÁO TỒN KHO ====================

class DashboardInventoryAlert(BaseModel):
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    don_vi_do_luong: str
    ngay_ghi_nhan: date

    ton_kho_thuc_te: Decimal
    so_luong_book: Decimal
    ton_kho_kha_dung: Decimal
    ton_kho_an_toan: Decimal
    so_luong_thieu_an_toan: Decimal

    muc_do_canh_bao: str = "CANH_BAO"

    @field_serializer(
        "ton_kho_thuc_te",
        "so_luong_book",
        "ton_kho_kha_dung",
        "ton_kho_an_toan",
        "so_luong_thieu_an_toan",
    )
    def serialize_quantity(
        self,
        value: Decimal,
    ) -> str:
        return format(value, ".2f")


class InventoryAlertSummary(BaseModel):
    tong_so_nguyen_lieu: int
    duoi_ton_an_toan: int
    khan_cap: int
    canh_bao: int
    an_toan: int
    ty_le_an_toan: float

    items: list[DashboardInventoryAlert]


# ==================== ĐIỂM NHÀ CUNG CẤP ====================

class DashboardSupplierPerformance(BaseModel):
    ma_ncc: str
    ten_ncc: str

    diem_ncc: Decimal | None
    ty_le_giao_dung_han_thuc_te: Decimal | None
    ty_le_giao_du_thuc_te: Decimal | None

    xep_loai: str = "TRUNG_BINH"

    @field_serializer(
        "diem_ncc",
        "ty_le_giao_dung_han_thuc_te",
        "ty_le_giao_du_thuc_te",
    )
    def serialize_score(
        self,
        value: Decimal | None,
    ) -> str | None:
        if value is None:
            return None

        return format(value, ".2f")


# ==================== NGUYÊN LIỆU SỬ DỤNG ====================

class MaterialUsageItem(BaseModel):
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    don_vi_do_luong: str

    so_luong_su_dung: float
    ty_le_phan_tram: float


class MaterialUsageSummary(BaseModel):
    tong_luong_su_dung: float
    so_loai_nguyen_lieu: int

    nguyen_lieu_dung_nhieu_nhat: MaterialUsageItem | None
    nguyen_lieu_dung_it_nhat: MaterialUsageItem | None


class MaterialUsageResponse(BaseModel):
    period_type: str
    period_label: str

    start_date: date
    end_date: date

    top_used: list[MaterialUsageItem]
    least_used: list[MaterialUsageItem]
    all_materials: list[MaterialUsageItem]

    summary: MaterialUsageSummary


# ==================== SẢN PHẨM TIÊU THỤ ====================

class ProductConsumptionItem(BaseModel):
    ma_san_pham: str
    ten_san_pham: str
    don_vi_tinh: str

    so_luong_ban: int
    doanh_thu: float
    so_don_hang: int
    ty_le_phan_tram: float


class ProductConsumptionSummary(BaseModel):
    tong_so_luong: int
    tong_doanh_thu: float
    tong_don_hang: int
    so_loai_san_pham: int

    san_pham_ban_chay_nhat: ProductConsumptionItem | None
    san_pham_ban_it_nhat: ProductConsumptionItem | None


class OrderFormulaUsageItem(BaseModel):
    ma_cong_thuc: str
    ten_cong_thuc: str
    ten_san_pham: str
    so_luong_san_pham_ban: int
    so_luong_cong_thuc_su_dung: float


class ProductConsumptionResponse(BaseModel):
    period_type: str
    period_label: str

    start_date: date
    end_date: date

    top_products: list[ProductConsumptionItem]
    least_products: list[ProductConsumptionItem]
    all_products: list[ProductConsumptionItem]
    formulas: list[OrderFormulaUsageItem]
    materials: list[MaterialUsageItem]

    summary: ProductConsumptionSummary


# ==================== SO SÁNH PROPHET VÀ THỰC TẾ ====================

class ProphetComparisonItem(BaseModel):
    nhan_thoi_gian: str

    tu_ngay: date
    den_ngay: date

    thuc_te: int
    du_bao_prophet: float

    can_duoi: float | None
    can_tren: float | None

    chenh_lech: float
    phan_tram_lech: float
    danh_gia: str


class ProphetProductComparisonItem(BaseModel):
    ma_san_pham: str
    ten_san_pham: str

    thuc_te: int
    du_bao_prophet: float

    chenh_lech: float
    phan_tram_lech: float


class ProphetComparisonSummary(BaseModel):
    tong_thuc_te: int
    tong_prophet: float
    tong_chenh_lech: float

    phan_tram_lech_tong: float
    mae: float
    mape: float


class ProphetComparisonResponse(BaseModel):
    tu_ngay: date
    den_ngay: date
    ma_san_pham: str | None

    periods: list[ProphetComparisonItem]
    products: list[ProphetProductComparisonItem]

    summary: ProphetComparisonSummary


# ==================== TÀI KHOẢN VÀ VAI TRÒ ====================

class RoleGroupStat(BaseModel):
    vai_tro: str
    label: str
    so_luong: int
    ty_le: float


class RecentLoginItem(BaseModel):
    ten_tai_khoan: str
    ma_nguoi_dung: str
    vai_tro: str
    thoi_gian_dang_nhap: datetime


class AccountStatisticsResponse(BaseModel):
    tong_tai_khoan: int
    dang_hoat_dong: int
    ngung_hoat_dong: int
    ty_le_hoat_dong: float

    vai_tro_distribution: list[RoleGroupStat]
    recent_logins: list[RecentLoginItem]


# ==================== ĐƠN HÀNG BÁN ====================

class OrderDetailStatItem(BaseModel):
    ma_don_hang: str
    ngay_ban: date | None

    tong_so_luong: int
    tong_gia_tri: float
    so_mat_hang: int


class OrderTimelineStat(BaseModel):
    nhan_thoi_gian: str

    so_don_hang: int
    tong_so_luong: int
    tong_gia_tri: float


class OrderStatsSummary(BaseModel):
    tong_so_don_hang: int
    tong_so_luong_ban: int
    tong_doanh_thu: float
    gia_tri_trung_binh_don: float

    don_hang_lon_nhat: OrderDetailStatItem | None
    don_hang_nho_nhat: OrderDetailStatItem | None


class OrderStatsResponse(BaseModel):
    period_type: str
    period_label: str

    start_date: date
    end_date: date

    top_orders: list[OrderDetailStatItem]
    least_orders: list[OrderDetailStatItem]
    timeline: list[OrderTimelineStat]

    summary: OrderStatsSummary


# ==================== CÔNG THỨC / BOM ====================

class FormulaMaterialUsageItem(BaseModel):
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    don_vi_do_luong: str

    so_cong_thuc_tham_gia: int
    ty_le_phoi_tron_tb: float

    trang_thai: str


class FormulaBomStatsResponse(BaseModel):
    tong_so_cong_thuc: int
    tong_so_nguyen_lieu: int

    nguyen_lieu_trong_bom: int
    nguyen_lieu_chua_dung: int

    top_materials: list[FormulaMaterialUsageItem]
    least_materials: list[FormulaMaterialUsageItem]
    unused_materials: list[FormulaMaterialUsageItem]


# ==================== TỒN KHO VÀ LƯỢNG BOOK ====================

class InventoryStockItem(BaseModel):
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    don_vi_do_luong: str

    so_luong_book: float
    ton_kho_thuc_te: float
    ton_kho_kha_dung: float
    ton_kho_an_toan: float
    so_luong_thieu_an_toan: float

    muc_do_canh_bao: str


class InventoryStockStatsResponse(BaseModel):
    tong_nguyen_lieu: int
    tong_luong_book: float
    tong_ton_thuc_te: float

    top_booked: list[InventoryStockItem]
    least_booked: list[InventoryStockItem]

    top_actual_stock: list[InventoryStockItem]
    least_actual_stock: list[InventoryStockItem]

    alerts: list[InventoryStockItem]


# ==================== NGUYÊN LIỆU CUNG ỨNG ====================

class SupplierMaterialDetailItem(BaseModel):
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str

    ma_ncc: str
    ten_ncc: str

    don_gia: float
    lead_time_ngay: int

    # None thể hiện chưa có dữ liệu đánh giá.
    # Giá trị 0 vẫn được giữ nguyên là 0%.
    ty_le_chat_luong_dat: float | None
    ty_le_giao_dung_han: float | None
    ty_le_giao_du: float | None


class SupplierSummaryByMaterial(BaseModel):
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str

    so_nha_cung_cap: int
    don_gia_thap_nhat: float
    don_gia_cao_nhat: float


class SupplierMaterialsStatsResponse(BaseModel):
    all_items: list[SupplierMaterialDetailItem]
    top_supplied_materials: list[SupplierSummaryByMaterial]
    least_supplied_materials: list[SupplierSummaryByMaterial]

    highest_price_items: list[SupplierMaterialDetailItem]
    lowest_price_items: list[SupplierMaterialDetailItem]

    best_quality_items: list[SupplierMaterialDetailItem]
    worst_quality_items: list[SupplierMaterialDetailItem]

    best_ontime_items: list[SupplierMaterialDetailItem]
    worst_ontime_items: list[SupplierMaterialDetailItem]


# ==================== GỢI Ý NHÀ CUNG CẤP ====================

class SuggestedSupplierItem(BaseModel):
    ma_ncc: str
    ten_ncc: str

    so_lan_goi_y_top1: int
    so_nguyen_lieu_cung_ung: int

    diem_ncc: float | None
    ty_le_dung_han: float | None

    trang_thai_goi_y: str


class SupplierSuggestionStatsResponse(BaseModel):
    co_du_lieu_lich_su: bool = False
    thong_bao: str | None = None

    tong_ncc: int

    # None khi chưa có nguồn lịch sử để thống kê.
    so_ncc_duoc_goi_y: int | None
    so_ncc_khong_goi_y: int | None

    top_suggested: list[SuggestedSupplierItem]
    least_suggested: list[SuggestedSupplierItem]
    not_suggested: list[SuggestedSupplierItem]


# ==================== NHU CẦU NGUYÊN LIỆU ====================

class MaterialDemandItem(BaseModel):
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    don_vi_do_luong: str

    nhu_cau: float
    ton_kho_kha_dung: float
    ton_kho_an_toan: float
    luong_can_mua: float


class MaterialDemandStatsResponse(BaseModel):
    co_du_lieu_du_bao: bool = True
    thong_bao: str | None = None
    ma_lich_su_du_bao: str | None = None

    tong_nhu_cau: float
    tong_can_mua: float

    top_demand: list[MaterialDemandItem]
    least_demand: list[MaterialDemandItem]
    all_demand: list[MaterialDemandItem]


# ==================== ĐƠN MUA NGUYÊN LIỆU ====================

class PurchaseOrderMaterialStat(BaseModel):
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    don_vi_do_luong: str

    so_luong_mua: float
    tong_gia_tri: float
    so_don_mua: int


class PurchaseOrderStatsResponse(BaseModel):
    tong_gia_tri_mua: float
    tong_so_don_mua: int

    top_purchased: list[PurchaseOrderMaterialStat]
    least_purchased: list[PurchaseOrderMaterialStat]
    all_purchased: list[PurchaseOrderMaterialStat]


# ==================== CẤU HÌNH VÀ NHẬT KÝ ====================

class AuditUserStat(BaseModel):
    ten_nguoi_thao_tac: str
    so_lan: int


class AuditFeatureStat(BaseModel):
    chuc_nang: str
    so_lan: int


class ConfigAuditStatsResponse(BaseModel):
    tong_nhat_ky: int

    top_users: list[AuditUserStat]
    top_features: list[AuditFeatureStat]

    ty_le_thanh_cong: float
