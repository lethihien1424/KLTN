# ###D:\KLTN\KLTN\backend\src\services\phan_quyen_service.py
# from datetime import datetime, timezone

# from fastapi import HTTPException, status
# from sqlalchemy import select, text
# from sqlalchemy.exc import IntegrityError
# from sqlalchemy.orm import Session

# from src.core.permission_catalog import (
#     ACCOUNT_ROLES,
#     ACTION_LABELS,
#     ADMIN_REQUIRED_PERMISSIONS,
#     PERMISSION_CATALOG,
# )
# from src.models.phan_quyen_model import (
#     ChiTietNhomQuyen,
#     NhomQuyen,
#     NhomQuyenVaiTro,
# )
# from src.models.user_model import User
# from src.repositories.phan_quyen_repository import PhanQuyenRepository
# from src.schemas.phan_quyen_schema import (
#     ChiTietQuyen,
#     ChucNangDanhMuc,
#     DanhMucPhanQuyenResponse,
#     NhomQuyenRequest,
#     NhomQuyenResponse,
#     QuyenCuaToiResponse,
#     ThaoTacDanhMuc,
#     VaiTroDanhMuc,
# )


# class PhanQuyenService:
#     def __init__(self) -> None:
#         self.repository = PhanQuyenRepository()

#     @staticmethod
#     def _ensure_admin_group(db: Session) -> None:
#         """Bootstrap once only. Never re-grant permissions on an existing ADMIN group."""
#         existing = db.execute(
#             select(NhomQuyenVaiTro.ma_nhom_quyen)
#             .where(NhomQuyenVaiTro.vai_tro == "ADMIN")
#             .limit(1)
#         ).first()
#         if existing:
#             return

#         # PostgreSQL transaction advisory lock prevents concurrent first-login seeding.
#         # Called only when the ADMIN role has no group at all.
#         try:
#             db.execute(text("SELECT pg_advisory_xact_lock(24061013)"))
#             existing = db.execute(
#                 select(NhomQuyenVaiTro.ma_nhom_quyen)
#                 .where(NhomQuyenVaiTro.vai_tro == "ADMIN")
#                 .limit(1)
#             ).first()
#             if existing:
#                 db.commit()
#                 return

#             full_permissions = {
#                 (feature_code, action)
#                 for feature_code, feature in PERMISSION_CATALOG.items()
#                 for action in feature["thao_tac"]
#             }
#             missing = ADMIN_REQUIRED_PERMISSIONS - full_permissions
#             if missing:
#                 raise RuntimeError(
#                     "Danh mục phân quyền thiếu quyền quản trị bắt buộc: "
#                     f"{sorted(missing)}"
#                 )

#             group = NhomQuyen(
#                 ten_quyen="Quản trị viên hệ thống",
#                 dien_giai=(
#                     "Nhóm quyền mặc định của ADMIN. Khởi tạo một lần; "
#                     "các quyền nghiệp vụ có thể được chỉnh sửa."
#                 ),
#                 vai_tro_ap_dung=[NhomQuyenVaiTro(vai_tro="ADMIN")],
#                 chi_tiet=[
#                     ChiTietNhomQuyen(chuc_nang=feature, thao_tac=action)
#                     for feature, action in sorted(full_permissions)
#                 ],
#             )
#             db.add(group)
#             db.flush()  # Let the database generate nhom_quyen.ma.
#             db.commit()
#         except Exception:
#             db.rollback()
#             raise

#     @staticmethod
#     def get_catalog() -> DanhMucPhanQuyenResponse:
#         return DanhMucPhanQuyenResponse(
#             vai_tro=[VaiTroDanhMuc(ma=code, ten=name) for code, name in ACCOUNT_ROLES.items()],
#             thao_tac=[ThaoTacDanhMuc(ma=code, ten=name) for code, name in ACTION_LABELS.items()],
#             chuc_nang=[
#                 ChucNangDanhMuc(
#                     ma=code, ten=item["ten"], thao_tac=list(item["thao_tac"])
#                 )
#                 for code, item in PERMISSION_CATALOG.items()
#             ],
#         )

#     @staticmethod
#     def _to_response(group: NhomQuyen) -> NhomQuyenResponse:
#         roles = sorted(item.vai_tro for item in group.vai_tro_ap_dung)
#         action_order = {action: i for i, action in enumerate(ACTION_LABELS)}
#         details = sorted(
#             group.chi_tiet,
#             key=lambda item: (item.chuc_nang, action_order.get(item.thao_tac, 999)),
#         )
#         return NhomQuyenResponse(
#             ma=group.ma,
#             ten_quyen=group.ten_quyen,
#             dien_giai=group.dien_giai,
#             vai_tro=roles,
#             chi_tiet=[
#                 ChiTietQuyen(chuc_nang=item.chuc_nang, thao_tac=item.thao_tac)
#                 for item in details
#             ],
#             duoc_xoa="ADMIN" not in roles,
#             nguoi_tao=group.nguoi_tao,
#             nguoi_cap_nhat=group.nguoi_cap_nhat,
#             thoi_gian_tao=group.thoi_gian_tao,
#             thoi_gian_cap_nhat=group.thoi_gian_cap_nhat,
#         )

#     @staticmethod
#     def _validate_payload(payload: NhomQuyenRequest) -> None:
#         if len(payload.vai_tro) != len(set(payload.vai_tro)):
#             raise HTTPException(status_code=422, detail="Vai trò áp dụng bị trùng.")

#         selected: set[tuple[str, str]] = set()
#         for item in payload.chi_tiet:
#             feature = PERMISSION_CATALOG.get(item.chuc_nang)
#             if feature is None:
#                 raise HTTPException(
#                     status_code=422,
#                     detail=f"Chức năng không hợp lệ: {item.chuc_nang}.",
#                 )
#             if item.thao_tac not in feature["thao_tac"]:
#                 raise HTTPException(
#                     status_code=422,
#                     detail=f"{feature['ten']} không hỗ trợ thao tác {item.thao_tac}.",
#                 )
#             key = (item.chuc_nang, item.thao_tac)
#             if key in selected:
#                 raise HTTPException(status_code=422, detail="Chi tiết quyền bị trùng.")
#             selected.add(key)

#         for feature_code, action in selected:
#             if action != "XEM" and (feature_code, "XEM") not in selected:
#                 raise HTTPException(
#                     status_code=422,
#                     detail=(
#                         f"Phải chọn quyền Xem cho "
#                         f"{PERMISSION_CATALOG[feature_code]['ten']} "
#                         "trước khi chọn thao tác khác."
#                     ),
#                 )

#         if "ADMIN" in payload.vai_tro:
#             if not ADMIN_REQUIRED_PERMISSIONS.issubset(selected):
#                 raise HTTPException(
#                     status_code=422,
#                     detail="Nhóm Admin phải giữ các quyền quản trị bắt buộc.",
#                 )

#     def get_all(self, db: Session, search: str | None = None) -> list[NhomQuyenResponse]:
#         self._ensure_admin_group(db)
#         return [
#             self._to_response(group)
#             for group in self.repository.get_all(db=db, search=search)
#         ]

#     def get_by_id(self, db: Session, ma: str) -> NhomQuyenResponse:
#         self._ensure_admin_group(db)
#         group = self.repository.get_by_id(db=db, ma=ma)
#         if group is None:
#             raise HTTPException(status_code=404, detail="Không tìm thấy nhóm quyền.")
#         return self._to_response(group)

#     def create(
#         self, db: Session, payload: NhomQuyenRequest, current_user: User
#     ) -> NhomQuyenResponse:
#         self._ensure_admin_group(db)
#         self._validate_payload(payload)
#         if "ADMIN" in payload.vai_tro:
#             raise HTTPException(
#                 status_code=409,
#                 detail="Vai trò ADMIN đã có nhóm quyền mặc định. Hãy sửa nhóm đó.",
#             )
#         if self.repository.name_exists(db=db, ten_quyen=payload.ten_quyen):
#             raise HTTPException(status_code=409, detail="Tên quyền đã tồn tại.")

#         group = NhomQuyen(
#             ten_quyen=payload.ten_quyen,
#             dien_giai=payload.dien_giai,
#             nguoi_tao=current_user.ma_nguoi_dung,
#             nguoi_cap_nhat=current_user.ma_nguoi_dung,
#             vai_tro_ap_dung=[
#                 NhomQuyenVaiTro(vai_tro=role) for role in payload.vai_tro
#             ],
#             chi_tiet=[
#                 ChiTietNhomQuyen(chuc_nang=item.chuc_nang, thao_tac=item.thao_tac)
#                 for item in payload.chi_tiet
#             ],
#         )
#         try:
#             self.repository.add(db=db, group=group)
#             db.flush()
#             result = self._to_response(group)
#             db.commit()
#             return result
#         except IntegrityError as exc:
#             db.rollback()
#             raise HTTPException(
#                 status_code=409,
#                 detail="Không thể lưu nhóm quyền do trùng hoặc vi phạm ràng buộc.",
#             ) from exc
#         except Exception:
#             db.rollback()
#             raise

#     def update(
#         self,
#         db: Session,
#         ma: str,
#         payload: NhomQuyenRequest,
#         current_user: User,
#     ) -> NhomQuyenResponse:
#         self._ensure_admin_group(db)
#         self._validate_payload(payload)
#         try:
#             group = self.repository.get_by_id(db=db, ma=ma, lock=True)
#             if group is None:
#                 raise HTTPException(status_code=404, detail="Không tìm thấy nhóm quyền.")
#             current_roles = {item.vai_tro for item in group.vai_tro_ap_dung}
#             if "ADMIN" in current_roles and "ADMIN" not in payload.vai_tro:
#                 raise HTTPException(
#                     status_code=400,
#                     detail="Không được gỡ ADMIN khỏi nhóm quyền quản trị.",
#                 )
#             if "ADMIN" not in current_roles and "ADMIN" in payload.vai_tro:
#                 raise HTTPException(
#                     status_code=409,
#                     detail="ADMIN đã có nhóm quyền mặc định. Không được gán thêm.",
#                 )
#             if "ADMIN" in current_roles and set(payload.vai_tro) != {"ADMIN"}:
#                 raise HTTPException(
#                     status_code=400,
#                     detail="Nhóm quyền ADMIN chỉ được áp dụng cho vai trò ADMIN.",
#                 )
#             if self.repository.name_exists(
#                 db=db, ten_quyen=payload.ten_quyen, exclude_ma=ma
#             ):
#                 raise HTTPException(status_code=409, detail="Tên quyền đã tồn tại.")

#             group.ten_quyen = payload.ten_quyen
#             group.dien_giai = payload.dien_giai
#             group.nguoi_cap_nhat = current_user.ma_nguoi_dung
#             group.thoi_gian_cap_nhat = datetime.now(timezone.utc)
#             group.vai_tro_ap_dung.clear()
#             group.chi_tiet.clear()
#             db.flush()
#             group.vai_tro_ap_dung.extend(
#                 NhomQuyenVaiTro(vai_tro=role) for role in payload.vai_tro
#             )
#             group.chi_tiet.extend(
#                 ChiTietNhomQuyen(chuc_nang=item.chuc_nang, thao_tac=item.thao_tac)
#                 for item in payload.chi_tiet
#             )
#             db.flush()
#             result = self._to_response(group)
#             db.commit()
#             return result
#         except IntegrityError as exc:
#             db.rollback()
#             raise HTTPException(
#                 status_code=409,
#                 detail="Không thể cập nhật nhóm quyền do trùng hoặc vi phạm ràng buộc.",
#             ) from exc
#         except Exception:
#             db.rollback()
#             raise

#     def delete(self, db: Session, ma: str) -> None:
#         self._ensure_admin_group(db)
#         try:
#             group = self.repository.get_by_id(db=db, ma=ma, lock=True)
#             if group is None:
#                 raise HTTPException(status_code=404, detail="Không tìm thấy nhóm quyền.")
#             if any(item.vai_tro == "ADMIN" for item in group.vai_tro_ap_dung):
#                 raise HTTPException(
#                     status_code=400, detail="Không thể xóa nhóm quyền ADMIN."
#                 )
#             self.repository.delete(db=db, group=group)
#             db.commit()
#         except IntegrityError as exc:
#             db.rollback()
#             raise HTTPException(status_code=409, detail="Không thể xóa nhóm quyền.") from exc
#         except Exception:
#             db.rollback()
#             raise

#     def get_my_permissions(
#         self, db: Session, current_user: User
#     ) -> QuyenCuaToiResponse:
#         if current_user.vai_tro == "ADMIN":
#             self._ensure_admin_group(db)
#         rows = self.repository.get_permissions_for_role(
#             db=db, vai_tro=current_user.vai_tro
#         )
#         valid = {
#             (feature_code, action)
#             for feature_code, action in rows
#             if feature_code in PERMISSION_CATALOG
#             and action in PERMISSION_CATALOG[feature_code]["thao_tac"]
#         }
#         effective = {
#             (feature_code, action)
#             for feature_code, action in valid
#             if action == "XEM" or (feature_code, "XEM") in valid
#         }
#         action_order = {action: i for i, action in enumerate(ACTION_LABELS)}
#         ordered = sorted(
#             effective,
#             key=lambda item: (item[0], action_order.get(item[1], 999)),
#         )
#         return QuyenCuaToiResponse(
#             ma_nguoi_dung=current_user.ma_nguoi_dung,
#             vai_tro=current_user.vai_tro,
#             chi_tiet=[
#                 ChiTietQuyen(chuc_nang=feature_code, thao_tac=action)
#                 for feature_code, action in ordered
#             ],
#         )
## D:\KLTN\KLTN\backend\src\services\phan_quyen_service.py
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.core.permission_catalog import (
    ACCOUNT_ROLES,
    ACTION_LABELS,
    ADMIN_REQUIRED_PERMISSIONS,
    PERMISSION_CATALOG,
    MENU_CATALOG,
)
from src.models.phan_quyen_model import (
    ChiTietNhomQuyen,
    NhomQuyen,
    NhomQuyenVaiTro,
)
from src.models.user_model import User
from src.repositories.phan_quyen_repository import PhanQuyenRepository
from src.schemas.phan_quyen_schema import (
    ChiTietQuyen,
    ChucNangDanhMuc,
    DanhMucPhanQuyenResponse,
    MenuConDanhMuc,
    NhomMenuDanhMuc,
    NhomQuyenRequest,
    NhomQuyenResponse,
    QuyenCuaToiResponse,
    ThaoTacDanhMuc,
    VaiTroDanhMuc,
)


class PhanQuyenService:
    def __init__(self) -> None:
        self.repository = PhanQuyenRepository()

    @staticmethod
    def _ensure_admin_group(db: Session) -> None:
        """Bootstrap once only. Never re-grant permissions on an existing ADMIN group."""
        existing = db.execute(
            select(NhomQuyenVaiTro.ma_nhom_quyen)
            .where(NhomQuyenVaiTro.vai_tro == "ADMIN")
            .limit(1)
        ).first()
        if existing:
            try:
                admin_group_id = existing[0]
                current_admin_perms = set(
                    db.execute(
                        select(ChiTietNhomQuyen.chuc_nang, ChiTietNhomQuyen.thao_tac)
                        .where(ChiTietNhomQuyen.ma_nhom_quyen == admin_group_id)
                    ).all()
                )
                needed_features = {"quan_ly_ly_do", "nhat_ky_hoat_dong"}
                added = False
                for feat in needed_features:
                    if feat in PERMISSION_CATALOG:
                        for act in PERMISSION_CATALOG[feat]["thao_tac"]:
                            if (feat, act) not in current_admin_perms:
                                db.add(ChiTietNhomQuyen(ma_nhom_quyen=admin_group_id, chuc_nang=feat, thao_tac=act))
                                added = True
                if added:
                    db.commit()
            except Exception:
                db.rollback()
            return

        # PostgreSQL transaction advisory lock prevents concurrent first-login seeding.
        # Called only when the ADMIN role has no group at all.
        try:
            db.execute(text("SELECT pg_advisory_xact_lock(24061013)"))
            existing = db.execute(
                select(NhomQuyenVaiTro.ma_nhom_quyen)
                .where(NhomQuyenVaiTro.vai_tro == "ADMIN")
                .limit(1)
            ).first()
            if existing:
                db.commit()
                return

            full_permissions = {
                (feature_code, action)
                for feature_code, feature in PERMISSION_CATALOG.items()
                for action in feature["thao_tac"]
            }
            missing = ADMIN_REQUIRED_PERMISSIONS - full_permissions
            if missing:
                raise RuntimeError(
                    "Danh mục phân quyền thiếu quyền quản trị bắt buộc: "
                    f"{sorted(missing)}"
                )

            group = NhomQuyen(
                ten_quyen="Quản trị viên hệ thống",
                dien_giai=(
                    "Nhóm quyền mặc định của ADMIN. Khởi tạo một lần; "
                    "các quyền nghiệp vụ có thể được chỉnh sửa."
                ),
                vai_tro_ap_dung=[NhomQuyenVaiTro(vai_tro="ADMIN")],
                chi_tiet=[
                    ChiTietNhomQuyen(chuc_nang=feature, thao_tac=action)
                    for feature, action in sorted(full_permissions)
                ],
            )
            db.add(group)
            db.flush()  # Let the database generate nhom_quyen.ma.
            db.commit()
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def get_catalog() -> DanhMucPhanQuyenResponse:
        return DanhMucPhanQuyenResponse(
            vai_tro=[
                VaiTroDanhMuc(ma=code, ten=name)
                for code, name in ACCOUNT_ROLES.items()
            ],
            thao_tac=[
                ThaoTacDanhMuc(ma=code, ten=name)
                for code, name in ACTION_LABELS.items()
            ],
            chuc_nang=[
                ChucNangDanhMuc(
                    ma=code,
                    ten=item["ten"],
                    thao_tac=list(item["thao_tac"]),
                )
                for code, item in PERMISSION_CATALOG.items()
            ],
            menu=[
                NhomMenuDanhMuc(
                    ma=group["ma"],
                    ten=group["ten"],
                    children=[
                        MenuConDanhMuc(
                            ma=item["ma"],
                            ten=item["ten"],
                            chuc_nang=item["chuc_nang"],
                            thao_tac=item.get("thao_tac", "XEM"),
                        )
                        for item in (
                            group["children"]
                            if "children" in group
                            else (group,)
                        )
                    ],
                )
                for group in MENU_CATALOG
            ],
        )

    @staticmethod
    def _to_response(group: NhomQuyen) -> NhomQuyenResponse:
        roles = sorted(item.vai_tro for item in group.vai_tro_ap_dung)
        action_order = {action: i for i, action in enumerate(ACTION_LABELS)}
        details = sorted(
            group.chi_tiet,
            key=lambda item: (item.chuc_nang, action_order.get(item.thao_tac, 999)),
        )
        return NhomQuyenResponse(
            ma=group.ma,
            ten_quyen=group.ten_quyen,
            dien_giai=group.dien_giai,
            vai_tro=roles,
            chi_tiet=[
                ChiTietQuyen(chuc_nang=item.chuc_nang, thao_tac=item.thao_tac)
                for item in details
            ],
            duoc_xoa="ADMIN" not in roles,
            nguoi_tao=group.nguoi_tao,
            nguoi_cap_nhat=group.nguoi_cap_nhat,
            thoi_gian_tao=group.thoi_gian_tao,
            thoi_gian_cap_nhat=group.thoi_gian_cap_nhat,
        )

    @staticmethod
    def _validate_payload(payload: NhomQuyenRequest) -> None:
        if len(payload.vai_tro) != len(set(payload.vai_tro)):
            raise HTTPException(status_code=422, detail="Vai trò áp dụng bị trùng.")

        selected: set[tuple[str, str]] = set()
        for item in payload.chi_tiet:
            feature = PERMISSION_CATALOG.get(item.chuc_nang)
            if feature is None:
                raise HTTPException(
                    status_code=422,
                    detail=f"Chức năng không hợp lệ: {item.chuc_nang}.",
                )
            if item.thao_tac not in feature["thao_tac"]:
                raise HTTPException(
                    status_code=422,
                    detail=f"{feature['ten']} không hỗ trợ thao tác {item.thao_tac}.",
                )
            key = (item.chuc_nang, item.thao_tac)
            if key in selected:
                raise HTTPException(status_code=422, detail="Chi tiết quyền bị trùng.")
            selected.add(key)

        for feature_code, action in selected:
            if action != "XEM" and (feature_code, "XEM") not in selected:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Phải chọn quyền Xem cho "
                        f"{PERMISSION_CATALOG[feature_code]['ten']} "
                        "trước khi chọn thao tác khác."
                    ),
                )

        if "ADMIN" in payload.vai_tro:
            if not ADMIN_REQUIRED_PERMISSIONS.issubset(selected):
                raise HTTPException(
                    status_code=422,
                    detail="Nhóm Admin phải giữ các quyền quản trị bắt buộc.",
                )

    def get_all(self, db: Session, search: str | None = None) -> list[NhomQuyenResponse]:
        self._ensure_admin_group(db)
        return [
            self._to_response(group)
            for group in self.repository.get_all(db=db, search=search)
        ]

    def get_by_id(self, db: Session, ma: str) -> NhomQuyenResponse:
        self._ensure_admin_group(db)
        group = self.repository.get_by_id(db=db, ma=ma)
        if group is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhóm quyền.")
        return self._to_response(group)

    def create(
        self, db: Session, payload: NhomQuyenRequest, current_user: User
    ) -> NhomQuyenResponse:
        self._ensure_admin_group(db)
        self._validate_payload(payload)
        if "ADMIN" in payload.vai_tro:
            raise HTTPException(
                status_code=409,
                detail="Vai trò ADMIN đã có nhóm quyền mặc định. Hãy sửa nhóm đó.",
            )
        if self.repository.name_exists(db=db, ten_quyen=payload.ten_quyen):
            raise HTTPException(status_code=409, detail="Tên quyền đã tồn tại.")

        group = NhomQuyen(
            ten_quyen=payload.ten_quyen,
            dien_giai=payload.dien_giai,
            nguoi_tao=current_user.ma_nguoi_dung,
            nguoi_cap_nhat=current_user.ma_nguoi_dung,
            vai_tro_ap_dung=[
                NhomQuyenVaiTro(vai_tro=role) for role in payload.vai_tro
            ],
            chi_tiet=[
                ChiTietNhomQuyen(chuc_nang=item.chuc_nang, thao_tac=item.thao_tac)
                for item in payload.chi_tiet
            ],
        )
        try:
            self.repository.add(db=db, group=group)
            db.flush()
            result = self._to_response(group)
            db.commit()
            return result
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Không thể lưu nhóm quyền do trùng hoặc vi phạm ràng buộc.",
            ) from exc
        except Exception:
            db.rollback()
            raise

    def update(
        self,
        db: Session,
        ma: str,
        payload: NhomQuyenRequest,
        current_user: User,
    ) -> NhomQuyenResponse:
        self._ensure_admin_group(db)
        self._validate_payload(payload)
        try:
            group = self.repository.get_by_id(db=db, ma=ma, lock=True)
            if group is None:
                raise HTTPException(status_code=404, detail="Không tìm thấy nhóm quyền.")
            current_roles = {item.vai_tro for item in group.vai_tro_ap_dung}
            if "ADMIN" in current_roles and "ADMIN" not in payload.vai_tro:
                raise HTTPException(
                    status_code=400,
                    detail="Không được gỡ ADMIN khỏi nhóm quyền quản trị.",
                )
            if "ADMIN" not in current_roles and "ADMIN" in payload.vai_tro:
                raise HTTPException(
                    status_code=409,
                    detail="ADMIN đã có nhóm quyền mặc định. Không được gán thêm.",
                )
            if "ADMIN" in current_roles and set(payload.vai_tro) != {"ADMIN"}:
                raise HTTPException(
                    status_code=400,
                    detail="Nhóm quyền ADMIN chỉ được áp dụng cho vai trò ADMIN.",
                )
            if self.repository.name_exists(
                db=db, ten_quyen=payload.ten_quyen, exclude_ma=ma
            ):
                raise HTTPException(status_code=409, detail="Tên quyền đã tồn tại.")

            group.ten_quyen = payload.ten_quyen
            group.dien_giai = payload.dien_giai
            group.nguoi_cap_nhat = current_user.ma_nguoi_dung
            group.thoi_gian_cap_nhat = datetime.now(timezone.utc)
            group.vai_tro_ap_dung.clear()
            group.chi_tiet.clear()
            db.flush()
            group.vai_tro_ap_dung.extend(
                NhomQuyenVaiTro(vai_tro=role) for role in payload.vai_tro
            )
            group.chi_tiet.extend(
                ChiTietNhomQuyen(chuc_nang=item.chuc_nang, thao_tac=item.thao_tac)
                for item in payload.chi_tiet
            )
            db.flush()
            result = self._to_response(group)
            db.commit()
            return result
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Không thể cập nhật nhóm quyền do trùng hoặc vi phạm ràng buộc.",
            ) from exc
        except Exception:
            db.rollback()
            raise

    def delete(self, db: Session, ma: str) -> None:
        self._ensure_admin_group(db)
        try:
            group = self.repository.get_by_id(db=db, ma=ma, lock=True)
            if group is None:
                raise HTTPException(status_code=404, detail="Không tìm thấy nhóm quyền.")
            if any(item.vai_tro == "ADMIN" for item in group.vai_tro_ap_dung):
                raise HTTPException(
                    status_code=400, detail="Không thể xóa nhóm quyền ADMIN."
                )
            self.repository.delete(db=db, group=group)
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=409, detail="Không thể xóa nhóm quyền.") from exc
        except Exception:
            db.rollback()
            raise

    def get_my_permissions(
        self, db: Session, current_user: User
    ) -> QuyenCuaToiResponse:
        if current_user.vai_tro == "ADMIN":
            self._ensure_admin_group(db)
        rows = self.repository.get_permissions_for_role(
            db=db, vai_tro=current_user.vai_tro
        )
        valid = {
            (feature_code, action)
            for feature_code, action in rows
            if feature_code in PERMISSION_CATALOG
            and action in PERMISSION_CATALOG[feature_code]["thao_tac"]
        }
        effective = {
            (feature_code, action)
            for feature_code, action in valid
            if action == "XEM" or (feature_code, "XEM") in valid
        }
        # Giữ quyền khôi phục hiện có, nhưng trả cùng tập quyền cho FE và API.
        if current_user.vai_tro == "ADMIN":
            effective.update({
                ("phan_quyen", "XEM"),
                ("phan_quyen", "THEM"),
                ("phan_quyen", "SUA"),
                ("quan_ly_ly_do", "XEM"),
                ("quan_ly_ly_do", "THEM"),
                ("quan_ly_ly_do", "SUA"),
                ("quan_ly_ly_do", "XAC_NHAN"),
                ("nhat_ky_hoat_dong", "XEM"),
                ("nhat_ky_hoat_dong", "XUAT_EXCEL"),
            })

        action_order = {action: i for i, action in enumerate(ACTION_LABELS)}
        ordered = sorted(
            effective,
            key=lambda item: (item[0], action_order.get(item[1], 999)),
        )
        return QuyenCuaToiResponse(
            ma_nguoi_dung=current_user.ma_nguoi_dung,
            vai_tro=current_user.vai_tro,
            chi_tiet=[
                ChiTietQuyen(chuc_nang=feature_code, thao_tac=action)
                for feature_code, action in ordered
            ],
        )

