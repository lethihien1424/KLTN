from src.schemas.cong_thuc_schema import CongThucCreate
from src.schemas.ton_kho_schema import TonKhoCreate
from src.schemas.nha_cung_cap_schema import NhaCungCapCreate
from src.services.cong_thuc_service import CongThucService
from src.services.ton_kho_service import TonKhoService
from src.services.nha_cung_cap_service import NhaCungCapService

from fastapi import (
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.exc import (
    DataError,
    IntegrityError,
    SQLAlchemyError,
)
from sqlalchemy.orm import Session

from src.core.import_permissions import (
    can_import,
)

from src.models.ke_hoach_san_xuat_model import (
    KeHoachSanXuat,
)
from src.models.lich_su_tieu_thu_model import (
    LichSuTieuThu,
)
from src.models.ngay_le_model import (
    NgayLe,
)
from src.models.nguyen_lieu_model import (
    NguyenLieu,
)
from src.models.nguyen_lieu_nha_cung_cap_model import (
    NguyenLieuNhaCungCap,
)
from src.models.san_pham_model import (
    SanPham,
)
from src.models.user_model import (
    User,
)

from src.repositories.nguyen_lieu_repository import NguyenLieuRepository

from src.repositories.import_repository import (
    ImportRepository,
)
from src.repositories.nhat_ky_repository import (
    NhatKyRepository,
)

from src.schemas.import_schema import (
    ImportResponse,
)

from src.services.data_processing.file_reader import (
    read_upload_file,
)

from src.services.data_processing.kiem_tra_du_lieu import (
    to_boolean,
    to_date,
    to_decimal,
    to_integer,
    to_string,
    validate_choice,
)

from src.services.data_processing.template_validator import (
    validate_columns,
)

from src.utils.password_utils import (
    hash_password,
)


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
        if not can_import(
            current_user.vai_tro,
            import_type,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Bạn không có quyền import "
                    "loại dữ liệu này."
                ),
            )

        try:
            dataframe, _ = await read_upload_file(
                file
            )

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

            elif import_type == (
                "nguyen_lieu_nha_cung_cap"
            ):
                imported = (
                    self._import_nguyen_lieu_ncc(
                        dataframe=dataframe,
                        db=db,
                    )
                )

            elif import_type == (
                "ton_kho_nguyen_lieu"
            ):
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
                    status_code=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                    detail=(
                        "Loại dữ liệu import "
                        "không hợp lệ."
                    ),
                )

            self.import_repository.commit(
                db=db
            )

            self._write_log(
                db=db,
                current_user=current_user,
                import_type=import_type,
                result="THANH_CONG",
                description=(
                    f"Import thành công "
                    f"{imported} dòng từ "
                    f"{file.filename}."
                ),
            )

            return ImportResponse(
                success=True,
                message="Upload file thành công.",
                total_rows=len(dataframe),
                imported_rows=imported,
            )

        except HTTPException as exc:
            self.import_repository.rollback(
                db=db
            )

            self._write_failure_log(
                db=db,
                current_user=current_user,
                import_type=import_type,
                file_name=file.filename,
                description=str(exc.detail),
            )

            raise

        except ValueError as exc:
            self.import_repository.rollback(
                db=db
            )

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
            self.import_repository.rollback(
                db=db
            )

            message = self._database_error_message(
                exc
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

        except DataError as exc:
            self.import_repository.rollback(
                db=db
            )

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
            self.import_repository.rollback(
                db=db
            )

            message = (
                "Upload thất bại do lỗi "
                "cơ sở dữ liệu."
            )

            self._write_failure_log(
                db=db,
                current_user=current_user,
                import_type=import_type,
                file_name=file.filename,
                description=message,
            )

            raise HTTPException(
                status_code=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
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
            row_number = int(
                row["_row_number"]
            )

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

            hashed_password = hash_password(
                plain_password
            )

            model = User(
                mat_khau=hashed_password,
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

        optional = {
            "nhom_san_pham",
        }

        validate_columns(
            dataframe=dataframe,
            required_columns=required,
            optional_columns=optional,
        )

        count = 0

        for _, row in dataframe.iterrows():
            row_number = int(
                row["_row_number"]
            )

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
            row_number = int(
                row["_row_number"]
            )

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

            NguyenLieuRepository.add_imported(
                db=db,
                values={
                    "ten_nguyen_lieu": model.ten_nguyen_lieu,
                    "don_vi_do_luong": model.don_vi_do_luong,
                    "trang_thai": model.trang_thai,
                },
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

        validate_columns(
            dataframe=dataframe,
            required_columns=required,
        )

        count = 0

        for _, row in dataframe.iterrows():
            row_number = int(
                row["_row_number"]
            )

            payload = NhaCungCapCreate(
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
            )

            NhaCungCapService().create_in_transaction(db, payload)

            count += 1

        NhaCungCapService().recalculate_all_in_transaction(db)

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
            row_number = int(
                row["_row_number"]
            )

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

        # Lead-time normalization is global, so a new mapping can change every
        # supplier's relative score.
        NhaCungCapService().recalculate_all_in_transaction(db)

        return count

    def _import_ton_kho(self, dataframe, db: Session) -> int:
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

        service = TonKhoService()
        for _, row in dataframe.iterrows():
            row_number = int(row["_row_number"])
            payload = TonKhoCreate(
                ma_nguyen_lieu=to_string(row["ma_nguyen_lieu"], "ma_nguyen_lieu", row_number),
                ngay_ghi_nhan=to_date(row["ngay_ghi_nhan"], "ngay_ghi_nhan", row_number),
                ton_kho_thuc_te=to_decimal(row["ton_kho_thuc_te"], "ton_kho_thuc_te", row_number),
                so_luong_book=to_decimal(row["so_luong_book"], "so_luong_book", row_number),
                ton_kho_an_toan=to_decimal(row["ton_kho_an_toan"], "ton_kho_an_toan", row_number),
                ton_kho_toi_da=to_decimal(row["ton_kho_toi_da"], "ton_kho_toi_da", row_number),
                trang_thai=to_string(row["trang_thai"], "trang_thai", row_number),
            )
            service.create_in_transaction(db, payload)
        return len(dataframe)

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
            row_number = int(
                row["_row_number"]
            )

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
                    f"Dòng {row_number}: "
                    "ngay_ket_thuc không được "
                    "nhỏ hơn ngay_bat_dau."
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

    def _import_cong_thuc(self, dataframe, db: Session) -> int:
        formula_columns = [
            "ten_cong_thuc", "ma_san_pham", "he_so_thu_hoi",
            "ty_le_hao_hut", "trang_thai",
        ]
        validate_columns(
            dataframe=dataframe,
            required_columns=set(formula_columns) | {"ma_nguyen_lieu", "ty_le_phoi_tron"},
            optional_columns={"ma_cong_thuc", "ma_chi_tiet_cong_thuc"},
        )
        # Keep the existing template/grouping and database-generated identifiers.
        grouped = dataframe.groupby(formula_columns, dropna=False, sort=False)
        imported_details = 0
        for group_values, group in grouped:
            row_number = int(group.iloc[0]["_row_number"])
            values = dict(zip(formula_columns, group_values))
            payload = CongThucCreate(
                **{key: to_string(values[key], key, row_number)
                   for key in ("ten_cong_thuc", "ma_san_pham", "trang_thai")},
                **{key: to_decimal(values[key], key, row_number)
                   for key in ("he_so_thu_hoi", "ty_le_hao_hut")},
                chi_tiet=[{
                    "ma_nguyen_lieu": to_string(row["ma_nguyen_lieu"], "ma_nguyen_lieu", int(row["_row_number"])),
                    "ty_le_phoi_tron": to_decimal(row["ty_le_phoi_tron"], "ty_le_phoi_tron", int(row["_row_number"])),
                } for _, row in group.iterrows()],
            )
            # No per-formula commit: ImportService commits the entire file once.
            CongThucService().create_in_transaction(db, payload)
            imported_details += len(payload.chi_tiet)
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

        for _, row in dataframe.iterrows():
            row_number = int(
                row["_row_number"]
            )

            order_status = (
                self._normalize_order_status(
                    row["trang_thai_don_hang"],
                    row_number,
                )
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

            if order_status == "DA_GIAO_HANG":
                discount = to_decimal(
                    row.get("muc_giam_gia"),
                    "muc_giam_gia",
                    row_number,
                    required=False,
                )

                if discount is None:
                    discount = 0

                promotion = row.get(
                    "co_khuyen_mai"
                )

                if promotion is None:
                    promotion = False

                else:
                    promotion = to_boolean(
                        promotion,
                        "co_khuyen_mai",
                        row_number,
                    )

                model = LichSuTieuThu(
                    ma_don_hang=ma_don_hang,
                    ma_san_pham=ma_san_pham,
                    ngay_ban=order_date,
                    so_luong_ban=quantity,
                    gia_goc=to_decimal(
                        row.get("gia_goc"),
                        "gia_goc",
                        row_number,
                        required=False,
                    ),
                    muc_giam_gia=discount,
                    gia_ban_sau_giam=to_decimal(
                        row.get(
                            "gia_ban_sau_giam"
                        ),
                        "gia_ban_sau_giam",
                        row_number,
                        required=False,
                    ),
                    co_khuyen_mai=promotion,
                    chuong_trinh_km=to_string(
                        row.get(
                            "chuong_trinh_km"
                        ),
                        "chuong_trinh_km",
                        row_number,
                        required=False,
                    ),
                    kenh_ban_hang=to_string(
                        row.get(
                            "kenh_ban_hang"
                        ),
                        "kenh_ban_hang",
                        row_number,
                        required=False,
                    ),
                    ma_ngay_le=to_string(
                        row.get(
                            "ma_ngay_le"
                        ),
                        "ma_ngay_le",
                        row_number,
                        required=False,
                    ),
                    trang_thai_san_xuat=(
                        "DA_SAN_XUAT"
                    ),
                )

            else:
                model = KeHoachSanXuat(
                    ma_don_hang=ma_don_hang,
                    ngay_don_hang=order_date,
                    ma_san_pham=ma_san_pham,
                    so_luong=quantity,
                    trang_thai_san_xuat=(
                        "CHO_SAN_XUAT"
                    ),
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
                f"Dòng {row_number}: "
                "trạng thái đơn hàng "
                "không được để trống."
            )

        normalized = (
            str(value)
            .strip()
            .upper()
            .replace(" ", "_")
        )

        mapping = {
            "DA_GIAO_HANG": (
                "DA_GIAO_HANG"
            ),
            "ĐÃ_GIAO_HÀNG": (
                "DA_GIAO_HANG"
            ),
            "ĐÃ_GIAO_HANG": (
                "DA_GIAO_HANG"
            ),
            "CHO_GIAO_HANG": (
                "CHO_GIAO_HANG"
            ),
            "CHỜ_GIAO_HÀNG": (
                "CHO_GIAO_HANG"
            ),
            "CHỜ_GIAO_HANG": (
                "CHO_GIAO_HANG"
            ),
        }

        result = mapping.get(
            normalized
        )

        if result is None:
            raise ValueError(
                f"Dòng {row_number}: "
                f"trạng thái '{value}' "
                "không hợp lệ. "
                "Chỉ chấp nhận "
                "'Đã giao hàng' hoặc "
                "'Chờ giao hàng'."
            )

        return result

    @staticmethod
    def _database_error_message(
        exc: IntegrityError,
    ) -> str:
        original = str(
            getattr(
                exc,
                "orig",
                exc,
            )
        )

        lowered = original.lower()

        if "foreign key" in lowered:
            return (
                "Upload thất bại: có mã "
                "tham chiếu không tồn tại "
                "trong bảng liên quan."
            )

        if (
            "duplicate key" in lowered
            or "unique constraint" in lowered
        ):
            return (
                "Upload thất bại: dữ liệu "
                "bị trùng khóa chính hoặc "
                "ràng buộc UNIQUE."
            )

        if "check constraint" in lowered:
            return (
                "Upload thất bại: có dữ liệu "
                "không đáp ứng điều kiện "
                "CHECK của bảng."
            )

        if (
            "not-null" in lowered
            or "not null" in lowered
        ):
            return (
                "Upload thất bại: có cột "
                "bắt buộc đang để trống."
            )

        if "value too long" in lowered:
            return (
                "Upload thất bại: dữ liệu "
                "vượt quá độ dài cho phép "
                "của cột."
            )

        return (
            "Upload thất bại do dữ liệu "
            "vi phạm ràng buộc cơ sở dữ liệu."
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
                f"Import file {file_name}: "
                f"{description}"
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
        if not self.log_repository.has_table(
            db
        ):
            return

        self.log_repository.log_action(
            db=db,
            ma_nguoi_dung=(
                current_user.ma_nguoi_dung
            ),
            hanh_dong=(
                f"IMPORT_{import_type.upper()}"
            ),
            ket_qua=result,
            mo_ta=description,
        )
