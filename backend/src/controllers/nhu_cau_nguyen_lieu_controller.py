from src.services.nhu_cau_nguyen_lieu_service import NhuCauNguyenLieuService


class NhuCauNguyenLieuController:
    def __init__(self):
        self.service = NhuCauNguyenLieuService()

    def preview(self, db, forecast_code):
        return self.service.preview(db, forecast_code)
