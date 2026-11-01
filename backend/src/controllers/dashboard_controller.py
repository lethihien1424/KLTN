##D:\KLTN\KLTN\backend\src\controllers\dashboard_controller.py
from datetime import date
from src.services.dashboard_service import DashboardService


class DashboardController:
    def __init__(self):
        self.service = DashboardService()

    def overview(self, db):
        return self.service.overview(db)

    def inventory_alerts(self, db):
        return self.service.inventory_alerts(db)

    def inventory_alerts_detailed(self, db):
        return self.service.inventory_alerts_detailed(db)

    def supplier_performance(self, db):
        return self.service.supplier_performance(db)

    def material_usage(
        self,
        db,
        period_type: str = "thang",
        year: int | None = None,
        month: int | None = None,
        week: int | None = None,
    ):
        return self.service.material_usage(db, period_type, year, month, week)

    def product_consumption(
        self,
        db,
        period_type: str = "thang",
        year: int | None = None,
        month: int | None = None,
        week: int | None = None,
        from_date: date | None = None,
        to_date: date | None = None,
    ):
        return self.service.product_consumption(db, period_type, year, month, week, from_date, to_date)

    def prophet_comparison(
        self,
        db,
        from_date: date | None = None,
        to_date: date | None = None,
        ma_san_pham: str | None = None,
    ):
        return self.service.prophet_comparison(db, from_date, to_date, ma_san_pham)

    def account_statistics(self, db):
        return self.service.account_statistics(db)

    def order_stats(
        self,
        db,
        period_type: str = "thang",
        year: int | None = None,
        month: int | None = None,
        week: int | None = None,
    ):
        return self.service.order_stats(db, period_type, year, month, week)

    def formula_bom_stats(self, db):
        return self.service.formula_bom_stats(db)

    def inventory_stock_stats(self, db):
        return self.service.inventory_stock_stats(db)

    def supplier_materials_stats(self, db):
        return self.service.supplier_materials_stats(db)

    def supplier_suggestion_stats(self, db):
        return self.service.supplier_suggestion_stats(db)

    def material_demand_stats(self, db):
        return self.service.material_demand_stats(db)

    def purchase_order_stats(self, db):
        return self.service.purchase_order_stats(db)

    def config_audit_stats(self, db):
        return self.service.config_audit_stats(db)


