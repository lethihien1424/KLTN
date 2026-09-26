from src.services.cong_thuc_service import CongThucService


class CongThucController:
    def __init__(self):
        self.service = CongThucService()

    def list(self, db, search=None, ma_san_pham=None, trang_thai=None):
        return self.service.list(db, search, ma_san_pham, trang_thai)

    def detail(self, db, code):
        return self.service.detail(db, code)

    def create(self, db, payload):
        return self.service.create(db, payload)

    def update(self, db, code, payload):
        return self.service.update(db, code, payload)

    def update_status(self, db, code, payload):
        return self.service.update_status(db, code, payload)
