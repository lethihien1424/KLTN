from src.services.don_mua_service import DonMuaService


class DonMuaController:
    def __init__(self):
        self.service = DonMuaService()

    def list(self, db, **filters):
        return self.service.list(db, **filters)

    def detail(self, db, code):
        return self.service.detail(db, code)

    def create(self, db, payload, current_user):
        return self.service.create(db, payload, current_user)

    def update(self, db, code, payload):
        return self.service.update(db, code, payload)

    def approve(self, db, code, current_user):
        return self.service.approve(db, code, current_user)

    def reject(self, db, code, payload, current_user):
        return self.service.reject(db, code, payload, current_user)

    def receive(self, db, code, payload):
        return self.service.receive(db, code, payload)
