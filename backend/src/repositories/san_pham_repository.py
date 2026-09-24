from sqlalchemy.orm import Session

from src.models.san_pham_model import SanPham


class SanPhamRepository:

    @staticmethod
    def get_san_pham_dang_kinh_doanh(
        db: Session,
    ) -> list[SanPham]:
        """
        Lấy tất cả sản phẩm đang kinh doanh
        để thực hiện dự báo nhu cầu.
        """

        return (
            db.query(SanPham)
            .filter(
                SanPham.trang_thai
                == "DANG_KINH_DOANH"
            )
            .order_by(
                SanPham.ma_san_pham.asc()
            )
            .all()
        )