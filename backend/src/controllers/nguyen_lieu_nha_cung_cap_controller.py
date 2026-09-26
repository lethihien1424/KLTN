from src.services.nguyen_lieu_nha_cung_cap_service import NguyenLieuNhaCungCapService


class NguyenLieuNhaCungCapController:
    def __init__(self):
        self.service = NguyenLieuNhaCungCapService()

    def list(self, db, **filters):
        return self.service.list(db, **filters)

    def detail(self, db, code):
        return self.service.detail(db, code)

    def create(self, db, payload):
        return self.service.create(db, payload)

    def update(self, db, code, payload):
        return self.service.update(db, code, payload)
