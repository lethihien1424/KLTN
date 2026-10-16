### D:\KLTN\KLTN\backend\src\services\data_processing\import_service.py

import logging
from decimal import Decimal

from fastapi import HTTPException, UploadFile
from pydantic import ValidationError
from sqlalchemy.exc import DataError, IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from src.core.import_permissions import can_import
from src.core.security import hash_password
from src.models.chi_tiet_cong_thuc_model import ChiTietCongThuc
from src.models.cong_thuc_model import CongThuc
from src.models.ngay_le_model import NgayLe
from src.models.nguyen_lieu_model import NguyenLieu
from src.models.nguyen_lieu_nha_cung_cap_model import (
    NguyenLieuNhaCungCap,
)
from src.models.nha_cung_cap_model import NhaCungCap
from src.models.san_pham_model import SanPham
from src.models.ton_kho_nguyen_lieu_model import TonKhoNguyenLieu
from src.models.user_model import User
from src.repositories.import_repository import ImportRepository
from src.repositories.nhat_ky_repository import NhatKyRepository
from src.schemas.du_lieu_ban_hang_schema import (
    DuLieuBanHangCreateRequest,
)
from src.schemas.import_schema import ImportResponse
from src.services.data_processing.file_reader import read_upload_file
from src.services.data_processing.kiem_tra_du_lieu import (
    to_date,
    to_decimal,
    to_integer,
    to_string,
    validate_choice,
)
from src.services.data_processing.lam_sach_du_lieu import (
    lam_sach_don_hang,
    lam_sach_ctkm,
)
from src.services.data_processing.template_validator import (
    validate_columns,
)
from src.services.du_lieu_ban_hang_service import (
    DuLieuBanHangService,
)
from src.services.phan_quyen_service import PhanQuyenService

logger = logging.getLogger(__name__)


class ImportService:
    def _check_permission(
        self,
        db: Session,
        current_user: User,
        import_type: str,
    ) -> None:
        if current_user.trang_thai != "HOAT_DONG":
            raise HTTPException(
                status_code=403,
                detail="Tài khoản đã ngưng hoạt động.",
            )

        if import_type == "don_hang":
            permissions = PhanQuyenService().get_my_permissions(
                db=db,
                current_user=current_user,
            )

            selected = {
                (item.chuc_nang, item.thao_tac)
                for item in permissions.chi_tiet
            }

            if ("du_lieu_ban_hang", "NHAP_FILE") not in selected:
                raise HTTPException(
                    status_code=403,
                    detail="Bạn chưa có quyền nhập file bán hàng.",
                )

            return

        if not can_import(current_user.vai_tro, import_type):
            raise HTTPException(
                status_code=403,
                detail="Bạn không có quyền import loại dữ liệu này.",
            )

    async def import_file(
        self,
        import_type: str,
        file: UploadFile,
        current_user: User,
        db: Session,
    ) -> ImportResponse:
        self._check_permission(db, current_user, import_type)

        handlers = {
            "users": self._import_users,
            "san_pham": self._import_san_pham,
            "nguyen_lieu": self._import_nguyen_lieu,
            "nha_cung_cap": self._import_nha_cung_cap,
            "nguyen_lieu_nha_cung_cap": self._import_nguyen_lieu_ncc,
            "ton_kho_nguyen_lieu": self._import_ton_kho,
            "ngay_le": self._import_ngay_le,
            "ctkm": self._import_ctkm,
            "cong_thuc": self._import_cong_thuc,
            "don_hang": self._import_don_hang,
        }

        handler = handlers.get(import_type)

        if handler is None:
            raise HTTPException(
                status_code=400,
                detail="Loại import không hợp lệ.",
            )

        try:
            dataframe, sheet_names = await read_upload_file(file)

            # CTKM dùng đúng một sheet theo template.
            # Không ảnh hưởng quy trình import các loại khác.
            if import_type == "ctkm":
                if sheet_names != ["Data"]:
                    raise ValueError(
                        "File CTKM phải là Excel .xlsx "
                        "và có đúng một sheet tên Data."
                    )

            imported = handler(dataframe, db)

            db.flush()

            response = ImportResponse(
                success=True,
                message="Upload file thành công.",
                total_rows=len(dataframe),
                imported_rows=imported,
            )

            # Chỉ commit khi toàn bộ file được xử lý thành công.
            db.commit()

        except HTTPException as exc:
            db.rollback()

            self._log(
                db=db,
                current_user=current_user,
                import_type=import_type,
                result="THAT_BAI",
                description=str(exc.detail),
            )

            raise

        except (ValueError, ValidationError) as exc:
            db.rollback()

            self._log(
                db=db,
                current_user=current_user,
                import_type=import_type,
                result="THAT_BAI",
                description=str(exc),
            )

            raise HTTPException(
                status_code=400,
                detail=str(exc),
            ) from exc

        except IntegrityError as exc:
            db.rollback()

            sqlstate = (
                getattr(exc.orig, "pgcode", None)
                or getattr(exc.orig, "sqlstate", None)
            )

            detail = (
                "Dữ liệu bị trùng mã hoặc ràng buộc UNIQUE."
                if sqlstate == "23505"
                else "Dữ liệu không đáp ứng ràng buộc DB."
            )

            self._log(
                db=db,
                current_user=current_user,
                import_type=import_type,
                result="THAT_BAI",
                description=detail,
            )

            raise HTTPException(
                status_code=409 if sqlstate == "23505" else 400,
                detail=detail,
            ) from exc

        except DataError as exc:
            db.rollback()

            raise HTTPException(
                status_code=400,
                detail="Dữ liệu vượt giới hạn số hoặc độ dài của DB.",
            ) from exc

        except SQLAlchemyError as exc:
            db.rollback()
            logger.exception("Không thể import dữ liệu.")

            raise HTTPException(
                status_code=500,
                detail="Không thể lưu dữ liệu lúc này.",
            ) from exc

        except Exception:
            db.rollback()
            logger.exception("Lỗi import chưa xử lý.")
            raise

        self._log(
            db=db,
            current_user=current_user,
            import_type=import_type,
            result="THANH_CONG",
            description=f"Import {imported} dòng từ {file.filename}.",
        )

        return response

    @staticmethod
    def _simple(
        dataframe,
        db: Session,
        model_class,
        fields: dict,
        optional: dict | None = None,
    ) -> int:
        optional = optional or {}

        validate_columns(
            dataframe=dataframe,
            required_columns=set(fields),
            optional_columns=set(optional),
        )

        count = 0

        for _, row in dataframe.iterrows():
            number = int(row["_row_number"])

            values = {
                name: converter(row[name], name, number)
                for name, converter in fields.items()
            }

            for name, converter in optional.items():
                values[name] = converter(
                    row.get(name),
                    name,
                    number,
                    required=False,
                )

            db.add(model_class(**values))
            count += 1

        return count

    @staticmethod
    def _import_users(dataframe, db: Session) -> int:
        validate_columns(
            dataframe=dataframe,
            required_columns={
                "mat_khau",
                "ho_ten",
                "vai_tro",
                "trang_thai",
            },
        )

        roles = {
            "ADMIN",
            "QUAN_LY_BAN_HANG",
            "QUAN_LY_MUA_HANG",
            "NHAN_VIEN_BAN_HANG",
            "NHAN_VIEN_MUA_HANG",
        }

        statuses = {
            "HOAT_DONG",
            "NGUNG_HOAT_DONG",
        }

        count = 0

        for _, row in dataframe.iterrows():
            number = int(row["_row_number"])

            role = to_string(
                row["vai_tro"],
                "vai_tro",
                number,
            )

            account_status = to_string(
                row["trang_thai"],
                "trang_thai",
                number,
            )

            validate_choice(
                role,
                roles,
                "vai_tro",
                number,
            )

            validate_choice(
                account_status,
                statuses,
                "trang_thai",
                number,
            )

            db.add(
                User(
                    mat_khau=hash_password(
                        to_string(
                            row["mat_khau"],
                            "mat_khau",
                            number,
                        )
                    ),
                    ho_ten=to_string(
                        row["ho_ten"],
                        "ho_ten",
                        number,
                    ),
                    vai_tro=role,
                    trang_thai=account_status,
                )
            )

            count += 1

        return count

    def _import_san_pham(
        self,
        dataframe,
        db: Session,
    ) -> int:
        return self._simple(
            dataframe=dataframe,
            db=db,
            model_class=SanPham,
            fields={
                "ten_san_pham": to_string,
                "khoi_luong": to_decimal,
                "don_vi_do_luong": to_string,
                "trang_thai": to_string,
                "don_gia": to_decimal,
                "don_vi_tien_te": to_string,
            },
            optional={
                "nhom_san_pham": to_string,
            },
        )

    def _import_nguyen_lieu(
        self,
        dataframe,
        db: Session,
    ) -> int:
        return self._simple(
            dataframe=dataframe,
            db=db,
            model_class=NguyenLieu,
            fields={
                "ten_nguyen_lieu": to_string,
                "don_vi_do_luong": to_string,
                "trang_thai": to_string,
            },
        )

    @staticmethod
    def _import_nha_cung_cap(
        dataframe,
        db: Session,
    ) -> int:
        from src.services.nha_cung_cap_service import (
            NhaCungCapService,
        )

        validate_columns(
            dataframe=dataframe,
            required_columns={
                "ten_ncc",
                "trang_thai",
            },
            optional_columns={
                "diem_dieu_kien_thuong_mai",
            },
        )

        imported_rows = 0

        for _, source in dataframe.iterrows():
            row_number = int(source["_row_number"])

            ten_ncc = to_string(
                source.get("ten_ncc"),
                "ten_ncc",
                row_number,
            )

            if len(ten_ncc) > 150:
                raise ValueError(
                    f"Dòng {row_number}: tên nhà cung cấp "
                    "không được vượt quá 150 ký tự."
                )

            trang_thai = to_string(
                source.get("trang_thai"),
                "trang_thai",
                row_number,
            ).upper()

            trang_thai = validate_choice(
                value=trang_thai,
                allowed_values={
                    "DANG_HOAT_DONG",
                    "NGUNG_HOAT_DONG",
                },
                column="trang_thai",
                row_number=row_number,
            )

            diem = to_decimal(
                source.get("diem_dieu_kien_thuong_mai"),
                "diem_dieu_kien_thuong_mai",
                row_number,
                required=False,
            )

            if diem is None:
                diem = Decimal("0")

            if not Decimal("0") <= diem <= Decimal("100"):
                raise ValueError(
                    f"Dòng {row_number}: điểm điều kiện "
                    "thương mại phải từ 0 đến 100."
                )

            if diem != diem.quantize(Decimal("0.01")):
                raise ValueError(
                    f"Dòng {row_number}: điểm điều kiện "
                    "thương mại chỉ được có tối đa "
                    "2 chữ số thập phân."
                )

            db.add(
                NhaCungCap(
                    ten_ncc=ten_ncc,
                    trang_thai=trang_thai,
                    diem_dieu_kien_thuong_mai=diem,
                )
            )

            imported_rows += 1

        db.flush()

        NhaCungCapService().recalculate_all_in_transaction(db)

        return imported_rows

    def _import_nguyen_lieu_ncc(
        self,
        dataframe,
        db: Session,
    ) -> int:
        from src.services.nha_cung_cap_service import (
            NhaCungCapService,
        )

        count = self._simple(
            dataframe=dataframe,
            db=db,
            model_class=NguyenLieuNhaCungCap,
            fields={
                "ma_ncc": to_string,
                "ma_nguyen_lieu": to_string,
                "don_gia_nguyen_lieu": to_decimal,
                "so_luong_ton_kho": to_decimal,
                "so_luong_book": to_decimal,
                "so_luong_xuat": to_decimal,
                "lead_time_ngay": to_integer,
                "ty_le_chat_luong_dat": to_decimal,
                "ty_le_giao_dung_han": to_decimal,
                "ty_le_giao_du": to_decimal,
            },
        )

        db.flush()

        NhaCungCapService().recalculate_all_in_transaction(db)

        return count

    def _import_ton_kho(
        self,
        dataframe,
        db: Session,
    ) -> int:
        return self._simple(
            dataframe=dataframe,
            db=db,
            model_class=TonKhoNguyenLieu,
            fields={
                "ma_nguyen_lieu": to_string,
                "ngay_ghi_nhan": to_date,
                "ton_kho_thuc_te": to_decimal,
                "so_luong_book": to_decimal,
                "ton_kho_an_toan": to_decimal,
                "ton_kho_toi_da": to_decimal,
                "trang_thai": to_string,
            },
        )

    def _import_ngay_le(
        self,
        dataframe,
        db: Session,
    ) -> int:
        validate_columns(
            dataframe=dataframe,
            required_columns={
                "ten_ngay_le",
                "ngay_bat_dau",
                "ngay_ket_thuc",
                "loai_ngay_le",
            },
        )

        count = 0

        for _, row in dataframe.iterrows():
            number = int(row["_row_number"])

            start = to_date(
                row["ngay_bat_dau"],
                "ngay_bat_dau",
                number,
            )

            end = to_date(
                row["ngay_ket_thuc"],
                "ngay_ket_thuc",
                number,
            )

            if end < start:
                raise ValueError(
                    f"Dòng {number}: ngày kết thúc "
                    "trước ngày bắt đầu."
                )

            db.add(
                NgayLe(
                    ten_ngay_le=to_string(
                        row["ten_ngay_le"],
                        "ten_ngay_le",
                        number,
                    ),
                    ngay_bat_dau=start,
                    ngay_ket_thuc=end,
                    loai_ngay_le=to_string(
                        row["loai_ngay_le"],
                        "loai_ngay_le",
                        number,
                    ),
                )
            )

            count += 1

        return count

    @staticmethod
    def _import_ctkm(
        dataframe,
        db: Session,
    ) -> int:
        # Làm sạch toàn bộ Excel trước khi ghi DB.
        cleaned = lam_sach_ctkm(dataframe)
        repository = ImportRepository()

        codes = {
            row["ma_ctkm"]
            for row in cleaned
        }

        product_codes = set()

        for row in cleaned:
            product_codes.update(
                row["ma_san_pham_ap_dung"]
            )

        existing_products = repository.get_existing_products(
            db,
            product_codes,
        )

        missing = product_codes - existing_products

        if missing:
            raise ValueError(
                "Mã sản phẩm chưa tồn tại trong DB: "
                + ", ".join(sorted(missing))
            )

        existing_ctkm = repository.get_ctkm_by_codes(
            db,
            codes,
        )

        # Kiểm tra điều kiện mới với những đơn hàng
        # đã liên kết CTKM trước khi thay đổi dữ liệu.
        for row in cleaned:
            code = row["ma_ctkm"]

            if code not in existing_ctkm:
                continue

            orders = repository.get_ctkm_orders(
                db,
                code,
            )

            expected_discount = (
                row["muc_giam_phan_tram"]
                / Decimal("100")
            )

            for order in orders:
                prefix = (
                    f"Dòng {row['_row_number']}: "
                    f"CTKM {code}, đơn {order.ma_don_hang}"
                )

                if (
                    order.ma_san_pham
                    not in row["ma_san_pham_ap_dung"]
                ):
                    raise ValueError(
                        f"{prefix}: không thể bỏ sản phẩm "
                        f"{order.ma_san_pham} đã áp dụng."
                    )

                if not (
                    row["ngay_bat_dau"]
                    <= order.ngay_ban
                    <= row["ngay_ket_thuc"]
                ):
                    raise ValueError(
                        f"{prefix}: ngày bán "
                        "không thuộc thời gian CTKM."
                    )

                if (
                    order.so_luong_ban
                    != row["so_luong_dat_quy_dinh"]
                ):
                    raise ValueError(
                        f"{prefix}: số lượng đơn hàng "
                        "không đúng điều kiện CTKM mới."
                    )

                if (
                    order.muc_giam_gia is None
                    or abs(
                        Decimal(str(order.muc_giam_gia))
                        - expected_discount
                    ) > Decimal("0.0001")
                ):
                    raise ValueError(
                        f"{prefix}: tỷ lệ giảm của đơn "
                        "không đúng điều kiện CTKM mới."
                    )

                if (
                    order.gia_goc is not None
                    and order.gia_ban_sau_giam is not None
                ):
                    expected_price = (
                        Decimal(str(order.gia_goc))
                        * (
                            Decimal("1")
                            - expected_discount
                        )
                    ).quantize(Decimal("0.01"))

                    actual_price = Decimal(
                        str(order.gia_ban_sau_giam)
                    )

                    if abs(
                        actual_price - expected_price
                    ) > Decimal("0.01"):
                        raise ValueError(
                            f"{prefix}: giá sau giảm "
                            "không còn đúng CTKM."
                        )

        # Thêm mới hoặc cập nhật theo mã CTKM.
        for row in cleaned:
            code = row["ma_ctkm"]

            values = {
                key: value
                for key, value in row.items()
                if key not in {
                    "_row_number",
                    "ma_san_pham_ap_dung",
                }
            }

            item = existing_ctkm.get(code)

            if item is None:
                repository.create_ctkm(
                    db=db,
                    values=values,
                )
                old_products = set()
            else:
                old_products = repository.get_ctkm_products(
                    db=db,
                    ma_ctkm=code,
                )

                for field, new_value in values.items():
                    if getattr(item, field) != new_value:
                        setattr(item, field, new_value)

            new_products = row[
                "ma_san_pham_ap_dung"
            ]

            for product in sorted(
                new_products - old_products
            ):
                repository.add_ctkm_product(
                    db=db,
                    ma_ctkm=code,
                    ma_san_pham=product,
                )

            for product in sorted(
                old_products - new_products
            ):
                repository.remove_ctkm_product(
                    db=db,
                    ma_ctkm=code,
                    ma_san_pham=product,
                )

        return len(cleaned)

    @staticmethod
    def _import_cong_thuc(
        dataframe,
        db: Session,
    ) -> int:
        formula_fields = [
            "ten_cong_thuc",
            "ma_san_pham",
            "he_so_thu_hoi",
            "ty_le_hao_hut",
            "trang_thai",
        ]

        validate_columns(
            dataframe=dataframe,
            required_columns=set(formula_fields) | {
                "ma_nguyen_lieu",
                "ty_le_phoi_tron",
            },
            optional_columns={
                "ma_cong_thuc",
                "ma_chi_tiet_cong_thuc",
            },
        )

        count = 0

        for values, group in dataframe.groupby(
            formula_fields,
            dropna=False,
            sort=False,
        ):
            name, product, recovery, loss, formula_status = values
            number = int(group.iloc[0]["_row_number"])

            formula = CongThuc(
                ten_cong_thuc=to_string(
                    name,
                    "ten_cong_thuc",
                    number,
                ),
                ma_san_pham=to_string(
                    product,
                    "ma_san_pham",
                    number,
                ),
                he_so_thu_hoi=to_decimal(
                    recovery,
                    "he_so_thu_hoi",
                    number,
                ),
                ty_le_hao_hut=to_decimal(
                    loss,
                    "ty_le_hao_hut",
                    number,
                ),
                trang_thai=to_string(
                    formula_status,
                    "trang_thai",
                    number,
                ),
            )

            db.add(formula)
            db.flush()

            for _, row in group.iterrows():
                row_number = int(row["_row_number"])

                db.add(
                    ChiTietCongThuc(
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
                )

                count += 1

        return count

    @staticmethod
    def _import_don_hang(
        dataframe,
        db: Session,
    ) -> int:
        cleaned = lam_sach_don_hang(dataframe, db)
        service = DuLieuBanHangService()

        count = 0

        for row in cleaned.to_dict(orient="records"):
            number = int(row.pop("_row_number"))

            try:
                payload = (
                    DuLieuBanHangCreateRequest.model_validate(row)
                )

                service.save_in_transaction(
                    db=db,
                    payload=payload,
                    ma=None,
                    use_product_price=False,
                )

            except ValidationError as exc:
                raise ValueError(
                    f"Dòng {number}: "
                    + "; ".join(
                        item["msg"]
                        for item in exc.errors()
                    )
                ) from exc

            except HTTPException as exc:
                raise ValueError(
                    f"Dòng {number}: {exc.detail}"
                ) from exc

            count += 1

        return count

    @staticmethod
    def _log(
        db: Session,
        current_user: User,
        import_type: str,
        result: str,
        description: str,
    ) -> None:
        try:
            repository = NhatKyRepository()

            if not repository.has_table(db):
                return

            repository.log_action(
                db=db,
                ma_nguoi_dung=current_user.ma_nguoi_dung,
                hanh_dong=f"IMPORT_{import_type.upper()}",
                ket_qua=result,
                mo_ta=description,
            )

        except Exception:
            db.rollback()
            logger.exception("Không thể ghi nhật ký import.")
