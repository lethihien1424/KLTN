###D:\KLTN\KLTN\backend\src\core\permission_catalog.py
from typing import Final


ACCOUNT_ROLES: Final[dict[str, str]] = {
    "ADMIN": "Quản trị viên",
    "QUAN_LY_BAN_HANG": "Quản lý bán hàng",
    "QUAN_LY_MUA_HANG": "Quản lý mua hàng",
    "NHAN_VIEN_BAN_HANG": "Nhân viên bán hàng",
    "NHAN_VIEN_MUA_HANG": "Nhân viên mua hàng",
}


# Xuất Excel nằm cuối.
ACTION_LABELS: Final[dict[str, str]] = {
    "XEM": "Xem",
    "THEM": "Thêm",
    "SUA": "Sửa",
    "XOA": "Xóa",
    "DUYET": "Duyệt",
    "TU_CHOI": "Từ chối",
    "CHAY_DU_BAO": "Chạy dự báo",
    "NHAP_FILE": "Nhập file",
    "XUAT_EXCEL": "Xuất Excel",
}


# Đây là danh mục cấu hình quyền.
# Chỉ những thao tác được liệt kê mới được phép lưu cho chức năng.
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
            "XEM", "THEM", "SUA", "XOA", "XUAT_EXCEL",
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
        "ten": "Dữ liệu bán hàng",
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
    "ke_hoach_mua_hang": {
        "ten": "Kế hoạch mua hàng",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "DUYET", "TU_CHOI", "XUAT_EXCEL",
        ),
    },
    "don_mua_nguyen_lieu": {
        "ten": "Đơn mua nguyên liệu",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "DUYET", "TU_CHOI", "NHAP_FILE", "XUAT_EXCEL",
        ),
    },
    "nguyen_lieu": {
        "ten": "Quản lý nguyên liệu",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "NHAP_FILE", "XUAT_EXCEL",
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
    "cong_thuc": {
        "ten": "Công thức BOM",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA",
            "NHAP_FILE", "XUAT_EXCEL",
        ),
    },
    "ti_le_hao_hut": {
        "ten": "Tỉ lệ hao hụt",
        "thao_tac": (
            "XEM", "THEM", "SUA", "XOA", "XUAT_EXCEL",
        ),
    },
    "nhu_cau_nguyen_lieu": {
        "ten": "Nhu cầu nguyên liệu",
        "thao_tac": ("XEM", "XUAT_EXCEL"),
    },
    "de_xuat_nhap_hang": {
        "ten": "Đề xuất nhập hàng",
        "thao_tac": ("XEM", "XUAT_EXCEL"),
    },
    "goi_y_nha_cung_cap": {
        "ten": "Gợi ý nhà cung cấp",
        "thao_tac": ("XEM", "XUAT_EXCEL"),
    },
}


# Nhóm áp dụng cho ADMIN phải giữ các quyền này.
ADMIN_REQUIRED_PERMISSIONS: Final[frozenset[tuple[str, str]]] = (
    frozenset(
        {
            ("phan_quyen", "XEM"),
            ("phan_quyen", "THEM"),
            ("phan_quyen", "SUA"),
            ("phan_quyen", "XOA"),
            ("tai_khoan", "XEM"),
            ("tai_khoan", "THEM"),
            ("tai_khoan", "SUA"),
            ("tai_khoan", "XOA"),
        }
    )
)