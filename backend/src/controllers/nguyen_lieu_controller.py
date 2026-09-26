from src.services.nguyen_lieu_service import NguyenLieuService


class NguyenLieuController:
    def __init__(self):
        self.service = NguyenLieuService()

    def list(self, db, search=None, trang_thai=None):
        return self.service.list(db, search, trang_thai)

    def get(self, db, code):
        return self.service.get(db, code)

    def create(self, db, payload):
        return self.service.create(db, payload)

    def update(self, db, code, payload):
        return self.service.update(db, code, payload)

    def update_status(self, db, code, payload):
        return self.service.update_status(db, code, payload)
