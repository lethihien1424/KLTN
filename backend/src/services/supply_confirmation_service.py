from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy import select, func, or_
from src.models.supply_confirmation import SupplyConfirmation
from src.models.nguyen_lieu_nha_cung_cap_model import NguyenLieuNhaCungCap
from src.models.nha_cung_cap_model import NhaCungCap
from src.models.lich_su_du_bao import LichSuDuBao
from src.models.chi_tiet_lich_su_du_bao import ChiTietLichSuDuBao
from src.models.chi_tiet_de_xuat import ChiTietDeXuatNhapHang
from src.models.de_xuat_nhap_hang import DeXuatNhapHang
from src.models.cong_thuc_model import CongThuc
from src.models.chi_tiet_cong_thuc_model import ChiTietCongThuc
from src.models.don_mua_nguyen_lieu import DonMuaNguyenLieu

UNKNOWN = "CHUA_XAC_NHAN"
ENOUGH = "DA_XAC_NHAN_DU"
INSUFFICIENT = "DA_XAC_NHAN_KHONG_DU"


class SupplyConfirmationService:
    @staticmethod
    def now(db):
        return db.scalar(select(func.clock_timestamp()))

    @staticmethod
    def latest(db, mapping_id, forecast=None):
        return db.scalar(select(SupplyConfirmation).where(
            SupplyConfirmation.ma_nguyen_lieu_ncc == mapping_id,
            SupplyConfirmation.ma_lich_su_du_bao == forecast,
        ).order_by(SupplyConfirmation.thoi_gian.desc(), SupplyConfirmation.id.desc()).limit(1))

    @staticmethod
    def classify(confirmation, quantity, now, allocated=Decimal("0")):
        if confirmation is None or not confirmation.ngay_xac_nhan <= now < confirmation.hieu_luc_den:
            return UNKNOWN
        return ENOUGH if confirmation.so_luong_xac_nhan - allocated >= quantity else INSUFFICIENT

    def evaluate(self, db, mapping, quantity, forecast=None, exclude_proposal=None, now=None):
        details = self.evaluate_details(db, mapping, quantity, forecast, exclude_proposal, now)
        return details[0], details[1]

    def evaluate_details(self, db, mapping, quantity, forecast=None, exclude_proposal=None, now=None):
        confirmation = self.latest(db, mapping.ma_nguyen_lieu_ncc, forecast)
        allocated = Decimal("0")
        if confirmation:
            query = select(func.coalesce(func.sum(ChiTietDeXuatNhapHang.so_luong_de_xuat_kg), 0)).join(
                DeXuatNhapHang, DeXuatNhapHang.ma_de_xuat == ChiTietDeXuatNhapHang.ma_de_xuat,
            ).join(SupplyConfirmation, SupplyConfirmation.id == ChiTietDeXuatNhapHang.ma_xac_nhan).where(
                SupplyConfirmation.ma_nguyen_lieu_ncc == mapping.ma_nguyen_lieu_ncc,
                SupplyConfirmation.ma_lich_su_du_bao == forecast,
                DeXuatNhapHang.trang_thai.in_(("CHO_DUYET", "DA_DUYET")),
                or_(ChiTietDeXuatNhapHang.ma_xac_nhan == confirmation.id,
                    ~select(DonMuaNguyenLieu.ma_don_mua).where(
                    DonMuaNguyenLieu.ma_de_xuat == DeXuatNhapHang.ma_de_xuat,
                    DonMuaNguyenLieu.ma_ncc == mapping.ma_ncc,
                    DonMuaNguyenLieu.trang_thai == "DA_NHAN_HANG",
                ).correlate(DeXuatNhapHang).exists()),
            )
            if exclude_proposal:
                query = query.where(DeXuatNhapHang.ma_de_xuat != exclude_proposal)
            allocated = db.scalar(query)
        return self.classify(confirmation, quantity, now or self.now(db), allocated), confirmation, allocated

    @staticmethod
    def validate_forecast(db, forecast, material):
        if forecast and not db.scalar(select(ChiTietLichSuDuBao.ma_chi_tiet).where(
            ChiTietLichSuDuBao.ma_lich_su_du_bao == forecast,
            ChiTietLichSuDuBao.ma_nguyen_lieu.is_(None),
        ).join(CongThuc, CongThuc.ma_san_pham == ChiTietLichSuDuBao.ma_san_pham).join(
            ChiTietCongThuc, ChiTietCongThuc.ma_cong_thuc == CongThuc.ma_cong_thuc,
        ).where(ChiTietCongThuc.ma_nguyen_lieu == material, CongThuc.trang_thai == "DANG_SU_DUNG").limit(1)):
            raise HTTPException(422, "Nguyên liệu không thuộc kết quả/BOM của lần dự báo đã chọn.")

    def create(self, db, payload, actor):
        try:
            mapping = db.scalar(select(NguyenLieuNhaCungCap).where(
                NguyenLieuNhaCungCap.ma_nguyen_lieu_ncc == payload.ma_nguyen_lieu_ncc,
            ).with_for_update())
            if mapping is None:
                raise HTTPException(404, "Không tìm thấy dữ liệu cung ứng.")
            supplier = db.get(NhaCungCap, mapping.ma_ncc)
            if supplier.trang_thai != "DANG_HOAT_DONG":
                raise HTTPException(422, "Nhà cung cấp đã ngừng hoạt động.")
            self.validate_forecast(db, payload.ma_lich_su_du_bao, mapping.ma_nguyen_lieu)
            now = self.now(db)
            if payload.ngay_xac_nhan > now or payload.hieu_luc_den <= now:
                raise HTTPException(422, "Ngày xác nhận không ở tương lai; thời hạn hiệu lực phải còn hiệu lực.")
            previous = self.latest(db, mapping.ma_nguyen_lieu_ncc, payload.ma_lich_su_du_bao)
            if (previous.id if previous else None) != payload.phien_ban_truoc:
                raise HTTPException(409, "Xác nhận đã thay đổi. Tải lại trước khi ghi nhận.")
            # New evidence is appended; pending allocations across earlier versions still count.
            record = SupplyConfirmation(**payload.model_dump(exclude={"phien_ban_truoc"}), nguoi_xac_nhan=actor.ma_nguoi_dung)
            db.add(record)
            db.flush()
            db.refresh(record)
            result = self.response(record)
            db.commit()
            return result
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def response(record):
        return {column.name: getattr(record, column.name) for column in SupplyConfirmation.__table__.columns}
