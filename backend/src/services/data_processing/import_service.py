from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from zoneinfo import ZoneInfo

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.exc import DataError, IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from src.core.import_permissions import can_import
from src.models.chi_tiet_cong_thuc_model import ChiTietCongThuc
from src.models.cong_thuc_model import CongThuc
from src.models.ke_hoach_san_xuat_model import KeHoachSanXuat
from src.models.lich_su_tieu_thu_model import LichSuTieuThu
from src.models.ngay_le_model import NgayLe
from src.models.nguyen_lieu_model import NguyenLieu
from src.models.nguyen_lieu_nha_cung_cap_model import NguyenLieuNhaCungCap
from src.models.nha_cung_cap_model import NhaCungCap
from src.models.san_pham_model import SanPham
from src.models.ton_kho_nguyen_lieu_model import TonKhoNguyenLieu
from src.models.user_model import User
from src.repositories.import_repository import ImportRepository
from src.repositories.nhat_ky_repository import NhatKyRepository
from src.schemas.import_schema import ImportResponse
from src.services.data_processing.file_reader import read_upload_file
from src.services.data_processing.kiem_tra_du_lieu import (
    is_empty,
    to_boolean,
    to_date,
    to_decimal,
    to_integer,
    to_string,
    validate_choice,
)
from src.services.data_processing.template_validator import validate_columns
from src.utils.password_utils import hash_password


class ImportService:
    def __init__(self) -> None:
        self.import_repository = ImportRepository()
        self.log_repository = NhatKyRepository()

    async def import_file(
        self,
        import_type: str,
        file: UploadFile,
        current_user: User,
        db: Session,
    ) -> ImportResponse:
        if not can_import(current_user.vai_tro, import_type):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền import loại dữ liệu này.",
            )

        try:
            dataframe, _ = await read_upload_file(file)

            if import_type == "users":
                imported = self._import_users(
                    dataframe=dataframe,
                    current_user=current_user,
                    db=db,
                )
            elif import_type == "san_pham":
                imported = self._import_san_pham(
                    dataframe=dataframe,
                    db=db,
                )
            elif import_type == "nguyen_lieu":
                imported = self._import_nguyen_lieu(
                    dataframe=dataframe,
                    db=db,
                )
            elif import_type == "nha_cung_cap":
                imported = self._import_nha_cung_cap(
                    dataframe=dataframe,
                    db=db,
                )
            elif import_type == "nguyen_lieu_nha_cung_cap":
                imported = self._import_nguyen_lieu_ncc(
                    dataframe=dataframe,
                    db=db,
                )
            elif import_type == "ton_kho_nguyen_lieu":
                imported = self._import_ton_kho(
                    dataframe=dataframe,
                    db=db,
                )
            elif import_type == "ngay_le":
                imported = self._import_ngay_le(
                    dataframe=dataframe,
                    db=db,
                )
            elif import_type == "cong_thuc":
                imported = self._import_cong_thuc(
                    dataframe=dataframe,
                    db=db,
                )
            elif import_type == "don_hang":
                imported = self._import_don_hang(
                    dataframe=dataframe,
                    db=db,
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Loại dữ liệu import không hợp lệ.",
                )

            self.import_repository.commit(db=db)

            self._write_log(
                db=db,
                current_user=current_user,
                import_type=import_type,
                result="THANH_CONG",
                description=(
                    f"Import thành công {imported} dòng "
                    f"từ {file.filename}."
                ),
            )

            return ImportResponse(
                success=True,
                message="Upload file thành công.",
                total_rows=len(dataframe),
                imported_rows=imported,
            )

        except HTTPException as exc:
            self.import_repository.rollback(db=db)
            self._write_failure_log(
                db=db,
                current_user=current_user,
                import_type=import_type,
                file_name=file.filename,
                description=str(exc.detail),
            )
            raise

        except ValueError as exc:
            self.import_repository.rollback(db=db)
            self._write_failure_log(
                db=db,
                current_user=current_user,
                import_type=import_type,
                file_name=file.filename,
                description=str(exc),
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            ) from exc

        except IntegrityError as exc:
            self.import_repository.rollback(db=db)
            message = self._database_error_message(exc)
            self._write_failure_log(
                db=db,
                current_user=current_user,
                import_type=import_type,
                file_name=file.filename,
                description=message,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message,
            ) from exc

        except DataError as exc:
            self.import_repository.rollback(db=db)
            message = (
                "Upload thất bại do kiểu dữ liệu "
                "không phù hợp với PostgreSQL."
            )
            self._write_failure_log(
                db=db,
                current_user=current_user,
                import_type=import_type,
                file_name=file.filename,
                description=message,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message,
            ) from exc

        except SQLAlchemyError as exc:
            self.import_repository.rollback(db=db)
            message = "Upload thất bại do lỗi cơ sở dữ liệu."
            self._write_failure_log(
                db=db,
                current_user=current_user,
                import_type=import_type,
                file_name=file.filename,
                description=message,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=message,
            ) from exc

    def _import_users(
        self,
        dataframe,
        current_user: User,
        db: Session,
    ) -> int:
        required = {
            "mat_khau",
            "ho_ten",
            "vai_tro",
            "trang_thai",
        }
        validate_columns(
            dataframe=dataframe,
            required_columns=required,
        )

        allowed_roles = {
            "ADMIN",
            "QUAN_LY",
            "GIAM_SAT_BAN_HANG",
            "NHAN_VIEN_KE_HOACH_SAN_XUAT",
            "NHAN_VIEN_KHO",
            "NHAN_VIEN_MUA_HANG",
        }
        allowed_status = {
            "HOAT_DONG",
            "NGUNG_HOAT_DONG",
        }

        count = 0

        for _, row in dataframe.iterrows():
            row_number = int(row["_row_number"])

            plain_password = to_string(
                row["mat_khau"],
                "mat_khau",
                row_number,
            )
            ho_ten = to_string(
                row["ho_ten"],
                "ho_ten",
                row_number,
            )
            vai_tro = to_string(
                row["vai_tro"],
                "vai_tro",
                row_number,
            )
            trang_thai = to_string(
                row["trang_thai"],
                "trang_thai",
                row_number,
            )

            validate_choice(
                vai_tro,
                allowed_roles,
                "vai_tro",
                row_number,
            )
            validate_choice(
                trang_thai,
                allowed_status,
                "trang_thai",
                row_number,
            )

            model = User(
                mat_khau=hash_password(plain_password),
                ho_ten=ho_ten,
                vai_tro=vai_tro,
                trang_thai=trang_thai,
            )
            self.import_repository.add(
                db=db,
                model=model,
            )
            count += 1

        return count

    def _import_san_pham(
        self,
        dataframe,
        db: Session,
    ) -> int:
        required = {
            "ten_san_pham",
            "khoi_luong",
            "don_vi_do_luong",
            "trang_thai",
            "don_gia",
            "don_vi_tien_te",
        }
        optional = {"nhom_san_pham"}

        validate_columns(
            dataframe=dataframe,
            required_columns=required,
            optional_columns=optional,
        )

        count = 0

        for _, row in dataframe.iterrows():
            row_number = int(row["_row_number"])

            model = SanPham(
                ten_san_pham=to_string(
                    row["ten_san_pham"],
                    "ten_san_pham",
                    row_number,
                ),
                khoi_luong=to_decimal(
                    row["khoi_luong"],
                    "khoi_luong",
                    row_number,
                ),
                don_vi_do_luong=to_string(
                    row["don_vi_do_luong"],
                    "don_vi_do_luong",
                    row_number,
                ),
                nhom_san_pham=to_string(
                    row.get("nhom_san_pham"),
                    "nhom_san_pham",
                    row_number,
                    required=False,
                ),
                trang_thai=to_string(
                    row["trang_thai"],
                    "trang_thai",
                    row_number,
                ),
                don_gia=to_decimal(
                    row["don_gia"],
                    "don_gia",
                    row_number,
                ),
                don_vi_tien_te=to_string(
                    row["don_vi_tien_te"],
                    "don_vi_tien_te",
                    row_number,
                ),
            )
            self.import_repository.add(
                db=db,
                model=model,
            )
            count += 1

        return count

    def _import_nguyen_lieu(
        self,
        dataframe,
        db: Session,
    ) -> int:
        required = {
            "ten_nguyen_lieu",
            "don_vi_do_luong",
            "trang_thai",
        }
        validate_columns(
            dataframe=dataframe,
            required_columns=required,
        )

        count = 0

        for _, row in dataframe.iterrows():
            row_number = int(row["_row_number"])

            model = NguyenLieu(
                ten_nguyen_lieu=to_string(
                    row["ten_nguyen_lieu"],
                    "ten_nguyen_lieu",
                    row_number,
                ),
                don_vi_do_luong=to_string(
                    row["don_vi_do_luong"],
                    "don_vi_do_luong",
                    row_number,
                ),
                trang_thai=to_string(
                    row["trang_thai"],
                    "trang_thai",
                    row_number,
                ),
            )
            self.import_repository.add(
                db=db,
                model=model,
            )
            count += 1

        return count

    def _import_nha_cung_cap(
        self,
        dataframe,
        db: Session,
    ) -> int:
        required = {
            "ten_ncc",
            "trang_thai",
        }
        optional = {
            "diem_dieu_kien_thuong_mai",
        }

        validate_columns(
            dataframe=dataframe,
            required_columns=required,
            optional_columns=optional,
        )

        count = 0

        for _, row in dataframe.iterrows():
            row_number = int(row["_row_number"])
            score = to_decimal(
                row.get("diem_dieu_kien_thuong_mai"),
                "diem_dieu_kien_thuong_mai",
                row_number,
                required=False,
            )

            model = NhaCungCap(
                ten_ncc=to_string(
                    row["ten_ncc"],
                    "ten_ncc",
                    row_number,
                ),
                trang_thai=to_string(
                    row["trang_thai"],
                    "trang_thai",
                    row_number,
                ),
                diem_dieu_kien_thuong_mai=score,
            )
            self.import_repository.add(
                db=db,
                model=model,
            )
            count += 1

        return count

    def _import_nguyen_lieu_ncc(
        self,
        dataframe,
        db: Session,
    ) -> int:
        required = {
            "ma_ncc",
            "ma_nguyen_lieu",
            "don_gia_nguyen_lieu",
            "so_luong_ton_kho",
            "so_luong_book",
            "so_luong_xuat",
            "lead_time_ngay",
            "ty_le_chat_luong_dat",
            "ty_le_giao_dung_han",
            "ty_le_giao_du",
        }
        validate_columns(
            dataframe=dataframe,
            required_columns=required,
        )

        count = 0

        for _, row in dataframe.iterrows():
            row_number = int(row["_row_number"])

            model = NguyenLieuNhaCungCap(
                ma_ncc=to_string(
                    row["ma_ncc"],
                    "ma_ncc",
                    row_number,
                ),
                ma_nguyen_lieu=to_string(
                    row["ma_nguyen_lieu"],
                    "ma_nguyen_lieu",
                    row_number,
                ),
                don_gia_nguyen_lieu=to_decimal(
                    row["don_gia_nguyen_lieu"],
                    "don_gia_nguyen_lieu",
                    row_number,
                ),
                so_luong_ton_kho=to_decimal(
                    row["so_luong_ton_kho"],
                    "so_luong_ton_kho",
                    row_number,
                ),
                so_luong_book=to_decimal(
                    row["so_luong_book"],
                    "so_luong_book",
                    row_number,
                ),
                so_luong_xuat=to_decimal(
                    row["so_luong_xuat"],
                    "so_luong_xuat",
                    row_number,
                ),
                lead_time_ngay=to_integer(
                    row["lead_time_ngay"],
                    "lead_time_ngay",
                    row_number,
                ),
                ty_le_chat_luong_dat=to_decimal(
                    row["ty_le_chat_luong_dat"],
                    "ty_le_chat_luong_dat",
                    row_number,
                ),
                ty_le_giao_dung_han=to_decimal(
                    row["ty_le_giao_dung_han"],
                    "ty_le_giao_dung_han",
                    row_number,
                ),
                ty_le_giao_du=to_decimal(
                    row["ty_le_giao_du"],
                    "ty_le_giao_du",
                    row_number,
                ),
            )
            self.import_repository.add(
                db=db,
                model=model,
            )
            count += 1

        return count

    def _import_ton_kho(
        self,
        dataframe,
        db: Session,
    ) -> int:
        required = {
            "ma_nguyen_lieu",
            "ngay_ghi_nhan",
            "ton_kho_thuc_te",
            "so_luong_book",
            "ton_kho_an_toan",
            "ton_kho_toi_da",
            "trang_thai",
        }
        validate_columns(
            dataframe=dataframe,
            required_columns=required,
        )

        count = 0

        for _, row in dataframe.iterrows():
            row_number = int(row["_row_number"])

            model = TonKhoNguyenLieu(
                ma_nguyen_lieu=to_string(
                    row["ma_nguyen_lieu"],
                    "ma_nguyen_lieu",
                    row_number,
                ),
                ngay_ghi_nhan=to_date(
                    row["ngay_ghi_nhan"],
                    "ngay_ghi_nhan",
                    row_number,
                ),
                ton_kho_thuc_te=to_decimal(
                    row["ton_kho_thuc_te"],
                    "ton_kho_thuc_te",
                    row_number,
                ),
                so_luong_book=to_decimal(
                    row["so_luong_book"],
                    "so_luong_book",
                    row_number,
                ),
                ton_kho_an_toan=to_decimal(
                    row["ton_kho_an_toan"],
                    "ton_kho_an_toan",
                    row_number,
                ),
                ton_kho_toi_da=to_decimal(
                    row["ton_kho_toi_da"],
                    "ton_kho_toi_da",
                    row_number,
                ),
                trang_thai=to_string(
                    row["trang_thai"],
                    "trang_thai",
                    row_number,
                ),
            )
            self.import_repository.add(
                db=db,
                model=model,
            )
            count += 1

        return count

    def _import_ngay_le(
        self,
        dataframe,
        db: Session,
    ) -> int:
        required = {
            "ten_ngay_le",
            "ngay_bat_dau",
            "ngay_ket_thuc",
            "loai_ngay_le",
        }
        validate_columns(
            dataframe=dataframe,
            required_columns=required,
        )

        count = 0

        for _, row in dataframe.iterrows():
            row_number = int(row["_row_number"])
            ngay_bat_dau = to_date(
                row["ngay_bat_dau"],
                "ngay_bat_dau",
                row_number,
            )
            ngay_ket_thuc = to_date(
                row["ngay_ket_thuc"],
                "ngay_ket_thuc",
                row_number,
            )

            if ngay_ket_thuc < ngay_bat_dau:
                raise ValueError(
                    f"Dòng {row_number}: ngay_ket_thuc "
                    "không được nhỏ hơn ngay_bat_dau."
                )

            model = NgayLe(
                ten_ngay_le=to_string(
                    row["ten_ngay_le"],
                    "ten_ngay_le",
                    row_number,
                ),
                ngay_bat_dau=ngay_bat_dau,
                ngay_ket_thuc=ngay_ket_thuc,
                loai_ngay_le=to_string(
                    row["loai_ngay_le"],
                    "loai_ngay_le",
                    row_number,
                ),
            )
            self.import_repository.add(
                db=db,
                model=model,
            )
            count += 1

        return count

    def _import_cong_thuc(
        self,
        dataframe,
        db: Session,
    ) -> int:
        required = {
            "ten_cong_thuc",
            "ma_san_pham",
            "he_so_thu_hoi",
            "ty_le_hao_hut",
            "trang_thai",
            "ma_nguyen_lieu",
            "ty_le_phoi_tron",
        }
        optional = {
            "ma_cong_thuc",
            "ma_chi_tiet_cong_thuc",
        }
        validate_columns(
            dataframe=dataframe,
            required_columns=required,
            optional_columns=optional,
        )

        formula_columns = [
            "ten_cong_thuc",
            "ma_san_pham",
            "he_so_thu_hoi",
            "ty_le_hao_hut",
            "trang_thai",
        ]
        grouped = dataframe.groupby(
            formula_columns,
            dropna=False,
            sort=False,
        )
        imported_details = 0

        for group_values, group in grouped:
            (
                ten_cong_thuc,
                ma_san_pham,
                he_so_thu_hoi,
                ty_le_hao_hut,
                trang_thai,
            ) = group_values

            first_row = group.iloc[0]
            first_row_number = int(first_row["_row_number"])

            formula = CongThuc(
                ten_cong_thuc=to_string(
                    ten_cong_thuc,
                    "ten_cong_thuc",
                    first_row_number,
                ),
                ma_san_pham=to_string(
                    ma_san_pham,
                    "ma_san_pham",
                    first_row_number,
                ),
                he_so_thu_hoi=to_decimal(
                    he_so_thu_hoi,
                    "he_so_thu_hoi",
                    first_row_number,
                ),
                ty_le_hao_hut=to_decimal(
                    ty_le_hao_hut,
                    "ty_le_hao_hut",
                    first_row_number,
                ),
                trang_thai=to_string(
                    trang_thai,
                    "trang_thai",
                    first_row_number,
                ),
            )
            self.import_repository.add(
                db=db,
                model=formula,
            )
            self.import_repository.flush(db=db)

            for _, row in group.iterrows():
                row_number = int(row["_row_number"])

                detail = ChiTietCongThuc(
                    ma_cong_thuc=formula.ma_cong_thuc,
                    ma_nguyen_lieu=to_string(
                        row["ma_nguyen_lieu"],
                        "ma_nguyen_lieu",
                        row_number,
                    ),
                    ty_le_phoi_tron=to_decimal(
                        row["ty_le_phoi_tron"],
                        "ty_le_phoi_tron",
                        row_number,
                    ),
                )
                self.import_repository.add(
                    db=db,
                    model=detail,
                )
                imported_details += 1

        return imported_details

    def _import_don_hang(
        self,
        dataframe,
        db: Session,
    ) -> int:
        required = {
            "ma_don_hang",
            "ma_san_pham",
            "ngay_don_hang",
            "so_luong",
            "trang_thai_don_hang",
        }
        optional = {
            "gia_goc",
            "muc_giam_gia",
            "gia_ban_sau_giam",
            "co_khuyen_mai",
            "chuong_trinh_km",
            "kenh_ban_hang",
            "ma_ngay_le",
        }
        validate_columns(
            dataframe=dataframe,
            required_columns=required,
            optional_columns=optional,
        )

        count = 0
        seen_orders: set[tuple[str, str]] = set()
        valid_products: set[str] = set()
        valid_holidays: set[str] = set()
        today = datetime.now(
            ZoneInfo("Asia/Ho_Chi_Minh")
        ).date()

        def check_decimal(
            value: Decimal | None,
            column: str,
            row_number: int,
            *,
            maximum_fraction: Decimal | None = None,
        ) -> None:
            if value is None:
                return
            if not value.is_finite() or value < 0:
                raise ValueError(
                    f"Dòng {row_number}: cột '{column}' "
                    "phải là số không âm hữu hạn."
                )
            if (
                maximum_fraction is not None
                and value != value.quantize(maximum_fraction)
            ):
                raise ValueError(
                    f"Dòng {row_number}: cột '{column}' "
                    "có quá nhiều chữ số thập phân."
                )

        for _, row in dataframe.iterrows():
            row_number = int(row["_row_number"])
            order_status = self._normalize_order_status(
                row["trang_thai_don_hang"],
                row_number,
            )
            ma_don_hang = to_string(
                row["ma_don_hang"],
                "ma_don_hang",
                row_number,
            )
            ma_san_pham = to_string(
                row["ma_san_pham"],
                "ma_san_pham",
                row_number,
            )
            order_date = to_date(
                row["ngay_don_hang"],
                "ngay_don_hang",
                row_number,
            )
            quantity = to_integer(
                row["so_luong"],
                "so_luong",
                row_number,
            )

            if quantity <= 0:
                raise ValueError(
                    f"Dòng {row_number}: 'so_luong' "
                    "phải lớn hơn 0."
                )

            if (
                len(ma_don_hang) > 50
                or len(ma_san_pham) > 20
            ):
                raise ValueError(
                    f"Dòng {row_number}: mã đơn hoặc mã sản phẩm "
                    "vượt quá độ dài cho phép."
                )

            # Chỉ từ chối ngày tương lai với đơn đã giao.
            # Đơn chờ giao có thể có ngày trong tương lai.
            if (
                order_status == "DA_GIAO_HANG"
                and order_date > today
            ):
                raise ValueError(
                    f"Dòng {row_number}: đơn đã giao "
                    "không thể có ngày tương lai."
                )

            key = (ma_don_hang, ma_san_pham)
            if key in seen_orders:
                raise ValueError(
                    f"Dòng {row_number}: đơn {ma_don_hang}, "
                    f"sản phẩm {ma_san_pham} bị trùng trong file."
                )
            seen_orders.add(key)

            if ma_san_pham not in valid_products:
                product = db.query(SanPham).filter(
                    SanPham.ma_san_pham == ma_san_pham
                ).first()
                if product is None:
                    raise ValueError(
                        f"Dòng {row_number}: sản phẩm "
                        f"{ma_san_pham} không tồn tại."
                    )
                valid_products.add(ma_san_pham)

            for model in (
                LichSuTieuThu,
                KeHoachSanXuat,
            ):
                existing = db.query(model).filter(
                    model.ma_don_hang == ma_don_hang,
                    model.ma_san_pham == ma_san_pham,
                ).first()

                if existing is not None:
                    raise ValueError(
                        f"Dòng {row_number}: đơn {ma_don_hang}, "
                        f"sản phẩm {ma_san_pham} đã tồn tại. "
                        "Hãy cập nhật trạng thái đơn hiện có "
                        "thay vì import bản sao."
                    )

            if order_status == "DA_GIAO_HANG":
                discount = to_decimal(
                    row.get("muc_giam_gia"),
                    "muc_giam_gia",
                    row_number,
                    required=False,
                )
                if discount is None:
                    discount = Decimal("0")

                check_decimal(
                    discount,
                    "muc_giam_gia",
                    row_number,
                    maximum_fraction=Decimal("0.0001"),
                )
                if discount > 1:
                    raise ValueError(
                        f"Dòng {row_number}: 'muc_giam_gia' "
                        "phải từ 0 đến 1 (5% nhập 0.05)."
                    )

                base_price = to_decimal(
                    row.get("gia_goc"),
                    "gia_goc",
                    row_number,
                    required=False,
                )
                sale_price = to_decimal(
                    row.get("gia_ban_sau_giam"),
                    "gia_ban_sau_giam",
                    row_number,
                    required=False,
                )
                for value, column in (
                    (base_price, "gia_goc"),
                    (sale_price, "gia_ban_sau_giam"),
                ):
                    check_decimal(
                        value,
                        column,
                        row_number,
                        maximum_fraction=Decimal("0.01"),
                    )

                if (
                    base_price is not None
                    and sale_price is not None
                ):
                    expected = (
                        base_price
                        * (Decimal("1") - discount)
                    ).quantize(
                        Decimal("0.01"),
                        rounding=ROUND_HALF_UP,
                    )
                    if abs(sale_price - expected) > Decimal("0.01"):
                        raise ValueError(
                            f"Dòng {row_number}: "
                            "'gia_ban_sau_giam' phải bằng "
                            f"{expected} theo giá gốc "
                            "và mức giảm giá."
                        )

                campaign = to_string(
                    row.get("chuong_trinh_km"),
                    "chuong_trinh_km",
                    row_number,
                    required=False,
                )
                promotion = row.get("co_khuyen_mai")

                if is_empty(promotion):
                    promotion = (
                        discount > 0
                        or campaign is not None
                    )
                else:
                    promotion = to_boolean(
                        promotion,
                        "co_khuyen_mai",
                        row_number,
                    )

                if not promotion and (
                    discount > 0
                    or campaign is not None
                ):
                    raise ValueError(
                        f"Dòng {row_number}: 'co_khuyen_mai' "
                        "không khớp mức giảm/chương trình "
                        "khuyến mãi."
                    )

                holiday_id = to_string(
                    row.get("ma_ngay_le"),
                    "ma_ngay_le",
                    row_number,
                    required=False,
                )
                if (
                    holiday_id is not None
                    and holiday_id not in valid_holidays
                ):
                    holiday = db.query(NgayLe).filter(
                        NgayLe.ma_ngay_le == holiday_id
                    ).first()
                    if holiday is None:
                        raise ValueError(
                            f"Dòng {row_number}: ngày lễ "
                            f"{holiday_id} không tồn tại."
                        )
                    valid_holidays.add(holiday_id)

                model = LichSuTieuThu(
                    ma_don_hang=ma_don_hang,
                    ma_san_pham=ma_san_pham,
                    ngay_ban=order_date,
                    so_luong_ban=quantity,
                    gia_goc=base_price,
                    muc_giam_gia=discount,
                    gia_ban_sau_giam=sale_price,
                    co_khuyen_mai=promotion,
                    chuong_trinh_km=campaign,
                    kenh_ban_hang=to_string(
                        row.get("kenh_ban_hang"),
                        "kenh_ban_hang",
                        row_number,
                        required=False,
                    ),
                    ma_ngay_le=holiday_id,
                    trang_thai_san_xuat="DA_SAN_XUAT",
                )
            else:
                model = KeHoachSanXuat(
                    ma_don_hang=ma_don_hang,
                    ngay_don_hang=order_date,
                    ma_san_pham=ma_san_pham,
                    so_luong=quantity,
                    trang_thai_san_xuat="CHO_SAN_XUAT",
                )

            self.import_repository.add(
                db=db,
                model=model,
            )
            count += 1

        return count

    @staticmethod
    def _normalize_order_status(
        value,
        row_number: int,
    ) -> str:
        if value is None:
            raise ValueError(
                f"Dòng {row_number}: trạng thái đơn hàng "
                "không được để trống."
            )

        normalized = (
            str(value)
            .strip()
            .upper()
            .replace(" ", "_")
        )
        mapping = {
            "DA_GIAO_HANG": "DA_GIAO_HANG",
            "ĐÃ_GIAO_HÀNG": "DA_GIAO_HANG",
            "ĐÃ_GIAO_HANG": "DA_GIAO_HANG",
            "CHO_GIAO_HANG": "CHO_GIAO_HANG",
            "CHỜ_GIAO_HÀNG": "CHO_GIAO_HANG",
            "CHỜ_GIAO_HÀNG": "CHO_GIAO_HANG",
        }
        result = mapping.get(normalized)

        if result is None:
            raise ValueError(
                f"Dòng {row_number}: trạng thái '{value}' "
                "không hợp lệ. Chỉ chấp nhận "
                "'Đã giao hàng' hoặc 'Chờ giao hàng'."
            )

        return result

    @staticmethod
    def _database_error_message(
        exc: IntegrityError,
    ) -> str:
        original = str(getattr(exc, "orig", exc))
        lowered = original.lower()

        if "foreign key" in lowered:
            return (
                "Upload thất bại: có mã tham chiếu "
                "không tồn tại trong bảng liên quan."
            )
        if (
            "duplicate key" in lowered
            or "unique constraint" in lowered
        ):
            return (
                "Upload thất bại: dữ liệu bị trùng "
                "khóa chính hoặc ràng buộc UNIQUE."
            )
        if "check constraint" in lowered:
            return (
                "Upload thất bại: có dữ liệu không "
                "đáp ứng điều kiện CHECK của bảng."
            )
        if "not-null" in lowered or "not null" in lowered:
            return (
                "Upload thất bại: có cột bắt buộc "
                "đang để trống."
            )
        if "value too long" in lowered:
            return (
                "Upload thất bại: dữ liệu vượt quá "
                "độ dài cho phép của cột."
            )

        return (
            "Upload thất bại do dữ liệu vi phạm "
            "ràng buộc cơ sở dữ liệu."
        )

    def _write_failure_log(
        self,
        db: Session,
        current_user: User,
        import_type: str,
        file_name: str | None,
        description: str,
    ) -> None:
        self._write_log(
            db=db,
            current_user=current_user,
            import_type=import_type,
            result="THAT_BAI",
            description=(
                f"Import file {file_name}: {description}"
            ),
        )

    def _write_log(
        self,
        db: Session,
        current_user: User,
        import_type: str,
        result: str,
        description: str,
    ) -> None:
        if not self.log_repository.has_table(db):
            return

        self.log_repository.log_action(
            db=db,
            ma_nguoi_dung=current_user.ma_nguoi_dung,
            hanh_dong=f"IMPORT_{import_type.upper()}",
            ket_qua=result,
            mo_ta=description,
        )