from src.services.de_xuat_nhap_hang_service import DeXuatNhapHangService


class DeXuatController:
    def __init__(self):
        self.service = DeXuatNhapHangService()

    def list(self, db, **filters):
        return self.service.list(db, **filters)

    def detail(self, db, code):
        return self.service.detail(db, code)

    def create(self, db, payload, current_user):
        return self.service.create(db, payload, current_user)

    def approve(self, db, code, current_user):
        return self.service.approve(db, code, current_user)

    def reject(self, db, code, payload, current_user):
        return self.service.reject(db, code, payload, current_user)

    def generate_orders(self, db, code, payload, current_user):
        return self.service.generate_orders(db, code, payload, current_user)
