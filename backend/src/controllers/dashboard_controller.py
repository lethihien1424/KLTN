from src.services.dashboard_service import DashboardService


class DashboardController:
    def __init__(self):
        self.service = DashboardService()

    def overview(self, db):
        return self.service.overview(db)

    def inventory_alerts(self, db):
        return self.service.inventory_alerts(db)

    def supplier_performance(self, db):
        return self.service.supplier_performance(db)
