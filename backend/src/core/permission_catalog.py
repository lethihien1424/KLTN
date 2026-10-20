## D:\KLTN\KLTN\backend\src\core\permission_catalog.py
from typing import Final


ACCOUNT_ROLES: Final[dict[str, str]] = {
    "ADMIN": "Quản trị viên",
    "QUAN_LY_BAN_HANG": "Quản lý bán hàng",
    "QUAN_LY_MUA_HANG": "Quản lý mua hàng",
    "NHAN_VIEN_BAN_HANG": "Nhân viên bán hàng",
    "NHAN_VIEN_MUA_HANG": "Nhân viên mua hàng",
}


ACTION_LABELS: Final[dict[str, str]] = {
    "XEM": "Xem",
    "THEM": "Thêm",
    "SUA": "Sửa",
    "XOA": "Xóa",
    "DUYET": "Duyệt",
    "TU_CHOI": "Từ chối",
    "XAC_NHAN": "Xác nhận",
    "TINH_DIEM": "Tính điểm",
    "CHAY_DU_BAO": "Chạy dự báo",
    "NHAP_FILE": "Nhập file",
    "XUAT_EXCEL": "Xuất Excel",
}


# Quyền nghiệp vụ được lưu bằng cặp:
# (chuc_nang, thao_tac).
PERMISSION_CATALOG: Final[dict[str, dict]] = {
    "tai_khoan": {
        "ten": "Quản lý tài khoản",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "NHAP_FILE", "XUAT_EXCEL",
        ),
    },
    "phan_quyen": {
        "ten": "Phân quyền",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "XUAT_EXCEL",
        ),
    },
    "quan_ly_ly_do": {
        "ten": "Quản lý lý do",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XAC_NHAN",
        ),
    },
    "nhat_ky_hoat_dong": {
        "ten": "Nhật ký hoạt động",
        "thao_tac": ("XEM", "XUAT_EXCEL"),
    },
    "san_pham": {
        "ten": "Quản lý sản phẩm",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "NHAP_FILE", "XUAT_EXCEL",
        ),
    },
    "du_lieu_ban_hang": {
        "ten": "Dữ liệu đơn hàng",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "NHAP_FILE", "XUAT_EXCEL",
        ),
    },
    "du_bao_nhu_cau": {
        "ten": "Dự báo nhu cầu",
        "thao_tac": (
            "XEM", "CHAY_DU_BAO", "XUAT_EXCEL",
        ),
    },
    "danh_gia_mo_hinh": {
        "ten": "Đánh giá mô hình",
        "thao_tac": ("XEM",),
    },
    "lich_su_du_bao": {
        "ten": "Lịch sử dự báo",
        "thao_tac": ("XEM", "XUAT_EXCEL"),
    },
    "nguyen_lieu": {
        "ten": "Quản lý nguyên liệu",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "XAC_NHAN", "NHAP_FILE", "XUAT_EXCEL",
        ),
    },
    "cong_thuc": {
        "ten": "Công thức BOM",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "XAC_NHAN", "NHAP_FILE", "XUAT_EXCEL",
        ),
    },
    "ti_le_hao_hut": {
        "ten": "Tỉ lệ hao hụt",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "XUAT_EXCEL",
        ),
    },
    "ton_kho_nguyen_lieu": {
        "ten": "Tồn kho nguyên liệu",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "NHAP_FILE", "XUAT_EXCEL",
        ),
    },
    "nha_cung_cap": {
        "ten": "Nhà cung cấp",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "XAC_NHAN", "TINH_DIEM",
            "NHAP_FILE", "XUAT_EXCEL",
        ),
    },
    "nguyen_lieu_nha_cung_cap": {
        "ten": "Nguyên liệu của nhà cung cấp",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "NHAP_FILE", "XUAT_EXCEL",
        ),
    },
    "goi_y_nha_cung_cap": {
        "ten": "Gợi ý nhà cung cấp",
        "thao_tac": ("XEM", "XUAT_EXCEL"),
    },
    "hieu_suat_nha_cung_cap": {
        "ten": "Hiệu suất nhà cung cấp",
        "thao_tac": ("XEM",),
    },
    "nhu_cau_nguyen_lieu": {
        "ten": "Nhu cầu nguyên liệu",
        "thao_tac": ("XEM", "XUAT_EXCEL"),
    },
    "ke_hoach_mua_hang": {
        "ten": "Kế hoạch mua hàng",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "DUYET", "TU_CHOI", "XUAT_EXCEL",
        ),
    },
    "de_xuat_nhap_hang": {
        "ten": "Đề xuất nhập hàng",
        "thao_tac": (
            "XEM", "THEM", "DUYET",
            "TU_CHOI", "XUAT_EXCEL",
        ),
    },
    "don_mua_nguyen_lieu": {
        "ten": "Đơn mua nguyên liệu",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "DUYET", "TU_CHOI", "XAC_NHAN",
            "NHAP_FILE", "XUAT_EXCEL",
        ),
    },
    "dashboard_mua_hang": {
        "ten": "Dashboard mua hàng",
        "thao_tac": ("XEM",),
    },
}


ADMIN_REQUIRED_PERMISSIONS: Final[
    frozenset[tuple[str, str]]
] = frozenset({
    ("phan_quyen", "XEM"),
    ("phan_quyen", "THEM"),
    ("phan_quyen", "SUA"),
    ("phan_quyen", "XOA"),
    ("tai_khoan", "XEM"),
    ("tai_khoan", "THEM"),
    ("tai_khoan", "SUA"),
    ("tai_khoan", "XOA"),
})


# Menu chỉ mô tả cách nhóm các chức năng trên giao diện.
# Mã menu không tạo thêm quyền trong database.
#
# Menu cấp 1 có chuc_nang là mục độc lập; nhóm có children là menu cha.
# Nhóm cha hiển thị khi có ít nhất một mục con được phép xem.
# Các thao tác trong page vẫn kiểm tra quyền riêng.
MENU_CATALOG: Final[tuple[dict, ...]] = (
    {
        "ma": "san_pham",
        "ten": "Quản lý sản phẩm",
        "chuc_nang": "san_pham",
        "thao_tac": "XEM",
    },
    {
        "ma": "du_lieu_ban_hang",
        "ten": "Dữ liệu đơn hàng",
        "chuc_nang": "du_lieu_ban_hang",
        "thao_tac": "XEM",
    },
    {
        "ma": "nhom_du_bao",
        "ten": "Dự báo",
        "children": (
            {
                "ma": "du_bao_nhu_cau",
                "ten": "Dự báo nhu cầu",
                "chuc_nang": "du_bao_nhu_cau",
                "thao_tac": "XEM",
            },
            {
                "ma": "danh_gia_mo_hinh",
                "ten": "Đánh giá mô hình",
                "chuc_nang": "danh_gia_mo_hinh",
                "thao_tac": "XEM",
            },
            {
                "ma": "lich_su_du_bao",
                "ten": "Lịch sử dự báo",
                "chuc_nang": "lich_su_du_bao",
                "thao_tac": "XEM",
            },
        ),
    },
    {
        "ma": "nhom_nguyen_lieu",
        "ten": "Nguyên liệu",
        "children": (
            {
                "ma": "nguyen_lieu",
                "ten": "Nguyên liệu",
                "chuc_nang": "nguyen_lieu",
                "thao_tac": "XEM",
            },
            {
                "ma": "cong_thuc",
                "ten": "Công thức / BOM",
                "chuc_nang": "cong_thuc",
                "thao_tac": "XEM",
            },
            {
                "ma": "ti_le_hao_hut",
                "ten": "Tỉ lệ hao hụt",
                "chuc_nang": "ti_le_hao_hut",
                "thao_tac": "XEM",
            },
            {
                "ma": "ton_kho_nguyen_lieu",
                "ten": "Tồn kho nguyên liệu",
                "chuc_nang": "ton_kho_nguyen_lieu",
                "thao_tac": "XEM",
            },
            {
                "ma": "nguyen_lieu_nha_cung_cap",
                "ten": "Nguyên liệu cung ứng",
                "chuc_nang": "nguyen_lieu_nha_cung_cap",
                "thao_tac": "XEM",
            },
        ),
    },
    {
        "ma": "nhom_nha_cung_cap",
        "ten": "Nhà cung cấp",
        "children": (
            {
                "ma": "nha_cung_cap",
                "ten": "Nhà cung cấp",
                "chuc_nang": "nha_cung_cap",
                "thao_tac": "XEM",
            },
            {
                "ma": "goi_y_nha_cung_cap",
                "ten": "Gợi ý nhà cung cấp",
                "chuc_nang": "goi_y_nha_cung_cap",
                "thao_tac": "XEM",
            },
            {
                "ma": "hieu_suat_nha_cung_cap",
                "ten": "Hiệu suất nhà cung cấp",
                "chuc_nang": "hieu_suat_nha_cung_cap",
                "thao_tac": "XEM",
            },
            {
                "ma": "xem_thong_tin_nha_cung_cap",
                "ten": "Xem thông tin nhà cung cấp",
                "chuc_nang": "nha_cung_cap",
                "thao_tac": "XEM",
            },
        ),
    },
    {
        "ma": "nhom_mua_hang",
        "ten": "Mua hàng",
        "children": (
            {
                "ma": "nhu_cau_nguyen_lieu",
                "ten": "Nhu cầu nguyên liệu",
                "chuc_nang": "nhu_cau_nguyen_lieu",
                "thao_tac": "XEM",
            },
            {
                "ma": "de_xuat_nhap_hang",
                "ten": "Đề xuất nhập hàng",
                "chuc_nang": "de_xuat_nhap_hang",
                "thao_tac": "XEM",
            },
            {
                "ma": "don_mua_nguyen_lieu",
                "ten": "Đơn mua nguyên liệu",
                "chuc_nang": "don_mua_nguyen_lieu",
                "thao_tac": "XEM",
            },
            {
                "ma": "xem_ke_hoach_mua_hang",
                "ten": "Xem kế hoạch mua hàng",
                "chuc_nang": "ke_hoach_mua_hang",
                "thao_tac": "XEM",
            },
            {
                "ma": "dashboard_mua_hang",
                "ten": "Dashboard mua hàng",
                "chuc_nang": "dashboard_mua_hang",
                "thao_tac": "XEM",
            },
            {
                "ma": "duyet_ke_hoach_mua_hang",
                "ten": "Duyệt kế hoạch mua hàng",
                "chuc_nang": "ke_hoach_mua_hang",
                "thao_tac": "XEM",
            },
        ),
    },
    {
        "ma": "nhom_quan_tri",
        "ten": "Quản trị hệ thống",
        "children": (
            {
                "ma": "tai_khoan",
                "ten": "Quản lý tài khoản",
                "chuc_nang": "tai_khoan",
                "thao_tac": "XEM",
            },
            {
                "ma": "phan_quyen",
                "ten": "Phân quyền",
                "chuc_nang": "phan_quyen",
                "thao_tac": "XEM",
            },
        ),
    },
    {
        "ma": "nhom_cau_hinh",
        "ten": "Cấu hình",
        "children": (
            {
                "ma": "quan_ly_ly_do",
                "ten": "Quản lý lý do",
                "chuc_nang": "quan_ly_ly_do",
                "thao_tac": "XEM",
            },
            {
                "ma": "nhat_ky_hoat_dong",
                "ten": "Nhật ký hoạt động",
                "chuc_nang": "nhat_ky_hoat_dong",
                "thao_tac": "XEM",
            },
        ),
    },
)


def validate_menu_catalog() -> None:
    """Kiểm tra cấu hình; không ghi hoặc thay đổi database."""
    for feature_code, feature in PERMISSION_CATALOG.items():
        actions = feature["thao_tac"]

        if len(actions) != len(set(actions)):
            raise ValueError(
                f"Trùng thao tác của chức năng: {feature_code}"
            )

        if "XEM" not in actions:
            raise ValueError(
                f"Chức năng thiếu quyền XEM: {feature_code}"
            )

        for action in actions:
            if action not in ACTION_LABELS:
                raise ValueError(
                    f"Thao tác không tồn tại: {feature_code}/{action}"
                )

    for feature_code, action in ADMIN_REQUIRED_PERMISSIONS:
        feature = PERMISSION_CATALOG.get(feature_code)

        if feature is None or action not in feature["thao_tac"]:
            raise ValueError(
                "Quyền quản trị bắt buộc không hợp lệ: "
                f"{feature_code}/{action}"
            )

    seen_codes: set[str] = set()
    referenced_features: set[str] = set()

    def validate_item(item: dict) -> None:
        item_code = item["ma"]
        feature_code = item["chuc_nang"]
        action = item["thao_tac"]

        if item_code in seen_codes:
            raise ValueError(f"Trùng mã menu: {item_code}")
        seen_codes.add(item_code)

        feature = PERMISSION_CATALOG.get(feature_code)
        if feature is None:
            raise ValueError(
                f"Menu {item_code} tham chiếu chức năng "
                f"không tồn tại: {feature_code}"
            )
        if action not in feature["thao_tac"]:
            raise ValueError(
                f"Menu {item_code} tham chiếu thao tác "
                f"không hợp lệ: {feature_code}/{action}"
            )
        referenced_features.add(feature_code)

    for entry in MENU_CATALOG:
        if "children" not in entry:
            validate_item(entry)
            continue

        group_code = entry["ma"]
        if group_code in seen_codes:
            raise ValueError(f"Trùng mã menu: {group_code}")
        seen_codes.add(group_code)
        for item in entry["children"]:
            validate_item(item)

    missing_features = (
        set(PERMISSION_CATALOG) - referenced_features
    )

    if missing_features:
        raise ValueError(
            "Chức năng chưa được đưa vào cây menu: "
            + ", ".join(sorted(missing_features))
        )


validate_menu_catalog()