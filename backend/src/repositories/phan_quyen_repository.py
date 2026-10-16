####D:\KLTN\KLTN\backend\src\repositories\phan_quyen_repository.py
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from src.models.phan_quyen_model import (
    ChiTietNhomQuyen,
    NhomQuyen,
    NhomQuyenVaiTro,
)


class PhanQuyenRepository:
    @staticmethod
    def get_all(
        db: Session,
        search: str | None = None,
    ) -> list[NhomQuyen]:
        statement = (
            select(NhomQuyen)
            .options(
                selectinload(NhomQuyen.vai_tro_ap_dung),
                selectinload(NhomQuyen.chi_tiet),
            )
            .order_by(
                NhomQuyen.thoi_gian_tao.asc(),
                NhomQuyen.ma.asc(),
            )
        )

        if search and search.strip():
            statement = statement.where(
                NhomQuyen.ten_quyen.ilike(
                    f"%{search.strip()}%"
                )
            )

        return list(db.scalars(statement).all())

    @staticmethod
    def get_by_id(
        db: Session,
        ma: str,
        lock: bool = False,
    ) -> NhomQuyen | None:
        statement = (
            select(NhomQuyen)
            .where(NhomQuyen.ma == ma)
            .options(
                selectinload(NhomQuyen.vai_tro_ap_dung),
                selectinload(NhomQuyen.chi_tiet),
            )
        )

        if lock:
            statement = statement.with_for_update()

        return db.scalar(statement)

    @staticmethod
    def name_exists(
        db: Session,
        ten_quyen: str,
        exclude_ma: str | None = None,
    ) -> bool:
        statement = select(NhomQuyen.ma).where(
            func.lower(func.btrim(NhomQuyen.ten_quyen))
            == ten_quyen.strip().lower()
        )

        if exclude_ma is not None:
            statement = statement.where(
                NhomQuyen.ma != exclude_ma
            )

        return db.scalar(statement.limit(1)) is not None

    @staticmethod
    def add(
        db: Session,
        group: NhomQuyen,
    ) -> None:
        db.add(group)

    @staticmethod
    def delete(
        db: Session,
        group: NhomQuyen,
    ) -> None:
        db.delete(group)

    @staticmethod
    def get_permissions_for_role(
        db: Session,
        vai_tro: str,
    ) -> list[tuple[str, str]]:
        statement = (
            select(
                ChiTietNhomQuyen.chuc_nang,
                ChiTietNhomQuyen.thao_tac,
            )
            .join(
                NhomQuyenVaiTro,
                NhomQuyenVaiTro.ma_nhom_quyen
                == ChiTietNhomQuyen.ma_nhom_quyen,
            )
            .where(
                NhomQuyenVaiTro.vai_tro == vai_tro
            )
            .distinct()
            .order_by(
                ChiTietNhomQuyen.chuc_nang,
                ChiTietNhomQuyen.thao_tac,
            )
        )

        return [
            (row.chuc_nang, row.thao_tac)
            for row in db.execute(statement).all()
        ]