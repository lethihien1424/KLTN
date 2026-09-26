from sqlalchemy import or_, select

from src.models.chi_tiet_de_xuat import ChiTietDeXuatNhapHang
from src.models.de_xuat_nhap_hang import DeXuatNhapHang
from src.models.nguyen_lieu_model import NguyenLieu
from src.models.nguyen_lieu_nha_cung_cap_model import NguyenLieuNhaCungCap
from src.models.nha_cung_cap_model import NhaCungCap


class DeXuatRepository:
    @staticmethod
    def list(db, search=None, ngay_de_xuat=None, trang_thai=None):
        query = select(DeXuatNhapHang)
        if search and search.strip():
            term = search.strip().replace("/", "//").replace("%", "/%").replace("_", "/_")
            query = query.where(or_(
                DeXuatNhapHang.ma_de_xuat.ilike(f"%{term}%", escape="/"),
                DeXuatNhapHang.ghi_chu.ilike(f"%{term}%", escape="/"),
            ))
        if ngay_de_xuat is not None:
            query = query.where(DeXuatNhapHang.ngay_de_xuat_nhap_hang == ngay_de_xuat)
        if trang_thai is not None:
            query = query.where(DeXuatNhapHang.trang_thai == trang_thai)
        return list(db.scalars(query.order_by(
            DeXuatNhapHang.ngay_tao_de_xuat.desc(), DeXuatNhapHang.ma_de_xuat.desc()
        )))

    @staticmethod
    def get(db, code, lock=False):
        query = select(DeXuatNhapHang).where(DeXuatNhapHang.ma_de_xuat == code)
        if lock:
            query = query.with_for_update().execution_options(populate_existing=True)
        return db.scalar(query)

    @staticmethod
    def material(db, code, lock=False):
        query = select(NguyenLieu).where(NguyenLieu.ma_nguyen_lieu == code)
        if lock:
            query = query.with_for_update(read=True).execution_options(populate_existing=True)
        return db.scalar(query)

    @staticmethod
    def supplier(db, code, lock=False):
        query = select(NhaCungCap).where(NhaCungCap.ma_ncc == code)
        if lock:
            query = query.with_for_update(read=True).execution_options(populate_existing=True)
        return db.scalar(query)

    @staticmethod
    def mapping(db, material_code, supplier_code, lock=False):
        query = select(NguyenLieuNhaCungCap).where(
            NguyenLieuNhaCungCap.ma_nguyen_lieu == material_code,
            NguyenLieuNhaCungCap.ma_ncc == supplier_code,
        )
        if lock:
            query = query.with_for_update(read=True).execution_options(populate_existing=True)
        return db.scalar(query)

    @staticmethod
    def create(db, values):
        model = DeXuatNhapHang(**values)
        db.add(model)
        db.flush()
        db.refresh(model)
        return model

    @staticmethod
    def update_workflow(db, model, values):
        for key, value in values.items():
            setattr(model, key, value)
        db.flush()
        db.refresh(model)
        return model

    @staticmethod
    def add_details(db, proposal_code, items):
        for values in items:
            db.add(ChiTietDeXuatNhapHang(ma_de_xuat=proposal_code, **values))
        db.flush()

    @staticmethod
    def details(db, proposal_code):
        return db.execute(
            select(ChiTietDeXuatNhapHang, NguyenLieu, NhaCungCap)
            .join(NguyenLieu, ChiTietDeXuatNhapHang.ma_nguyen_lieu == NguyenLieu.ma_nguyen_lieu)
            .join(NhaCungCap, ChiTietDeXuatNhapHang.ma_ncc == NhaCungCap.ma_ncc)
            .where(ChiTietDeXuatNhapHang.ma_de_xuat == proposal_code)
            .order_by(ChiTietDeXuatNhapHang.ma_chi_tiet)
        ).all()

    @staticmethod
    def raw_details(db, proposal_code):
        return list(db.scalars(
            select(ChiTietDeXuatNhapHang)
            .where(ChiTietDeXuatNhapHang.ma_de_xuat == proposal_code)
            .order_by(ChiTietDeXuatNhapHang.ma_ncc, ChiTietDeXuatNhapHang.ma_chi_tiet)
        ))
