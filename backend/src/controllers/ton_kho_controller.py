from src.services.ton_kho_service import TonKhoService


class TonKhoController:
    def __init__(self):
        self.service = TonKhoService()

    def list(self, db, **filters):
        return self.service.list(db, **filters)

    def history(self, db, material_code):
        return self.service.history(db, material_code)

    def detail(self, db, material_code, recorded_date):
        return self.service.detail(db, material_code, recorded_date)

    def create(self, db, payload):
        return self.service.create(db, payload)

    def update(self, db, material_code, recorded_date, payload):
        return self.service.update(db, material_code, recorded_date, payload)
