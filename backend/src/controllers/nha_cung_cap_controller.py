from src.services.nha_cung_cap_service import NhaCungCapService


class NhaCungCapController:
    def __init__(self):
        self.service = NhaCungCapService()

    def list(self, db, **filters):
        return self.service.list(db, **filters)

    def detail(self, db, code):
        return self.service.detail(db, code)

    def create(self, db, payload):
        return self.service.create(db, payload)

    def update(self, db, code, payload):
        return self.service.update(db, code, payload)

    def update_status(self, db, code, payload):
        return self.service.update_status(db, code, payload)

    def calculate_score(self, db, code):
        return self.service.calculate_supplier_score(db, code)

    def calculate_all_scores(self, db):
        return self.service.recalculate_all(db)
