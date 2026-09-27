from src.services.goi_y_nha_cung_cap_service import GoiYNhaCungCapService


class GoiYNhaCungCapController:
    def __init__(self):
        self.service = GoiYNhaCungCapService()

    def suggest(self, db, material_code, purchase_quantity):
        return self.service.suggest(db, material_code, purchase_quantity)
