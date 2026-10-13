"""Stable API permission keys and initial configuration, never runtime role rules."""

MODULE_ACTIONS = {
    "NGUYEN_LIEU": ("VIEW", "CREATE", "UPDATE", "CHANGE_STATUS"),
    "CONG_THUC": ("VIEW", "CREATE", "UPDATE", "CHANGE_STATUS"),
    "TON_KHO": ("VIEW", "CREATE", "UPDATE", "HISTORY_VIEW"),
    "NHA_CUNG_CAP": ("VIEW", "CREATE", "UPDATE", "CHANGE_STATUS", "SCORE", "PERFORMANCE_VIEW"),
    "NGUYEN_LIEU_NCC": ("VIEW", "CREATE", "UPDATE"),
    "NHU_CAU_NGUYEN_LIEU": ("VIEW",),
    "GOI_Y_NHA_CUNG_CAP": ("VIEW",),
    "DE_XUAT_NHAP_HANG": ("VIEW", "CREATE", "APPROVE", "REJECT"),
    "DON_MUA": ("VIEW", "CREATE", "UPDATE", "APPROVE", "REJECT", "RECEIVE"),
    "DASHBOARD": ("VIEW",),
    "DU_BAO": ("VIEW", "RUN"),
    "USER": ("VIEW", "CREATE", "UPDATE", "DELETE", "ASSIGN_ROLE", "IMPORT"),
    "ROLE": ("VIEW", "CREATE", "UPDATE", "ASSIGN_PERMISSION"),
    "PERMISSION": ("VIEW",),
    # Import is an existing batch write capability; it deserves its own grant.
    "IMPORT": ("SAN_PHAM", "NGUYEN_LIEU", "CONG_THUC", "TON_KHO", "NHA_CUNG_CAP", "NGUYEN_LIEU_NCC", "NGAY_LE", "DON_HANG"),
}
MODULE_LABELS = {
    "NGUYEN_LIEU": "nguyên liệu", "CONG_THUC": "công thức / BOM",
    "TON_KHO": "tồn kho", "NHA_CUNG_CAP": "nhà cung cấp",
    "NGUYEN_LIEU_NCC": "nguyên liệu theo nhà cung cấp",
    "NHU_CAU_NGUYEN_LIEU": "nhu cầu nguyên liệu", "GOI_Y_NHA_CUNG_CAP": "gợi ý nhà cung cấp",
    "DE_XUAT_NHAP_HANG": "đề xuất nhập hàng", "DON_MUA": "đơn mua",
    "DASHBOARD": "Dashboard", "DU_BAO": "dự báo", "USER": "tài khoản",
    "ROLE": "vai trò", "PERMISSION": "danh sách quyền",
}
ACTION_LABELS = {
    "VIEW": "Xem", "CREATE": "Tạo", "UPDATE": "Cập nhật", "CHANGE_STATUS": "Đổi trạng thái",
    "HISTORY_VIEW": "Xem lịch sử", "SCORE": "Tính điểm", "PERFORMANCE_VIEW": "Xem hiệu suất",
    "APPROVE": "Duyệt", "REJECT": "Từ chối", "RECEIVE": "Nhận hàng của",
    "RUN": "Chạy", "DELETE": "Xóa", "ASSIGN_ROLE": "Gán vai trò cho",
    "IMPORT": "Import", "ASSIGN_PERMISSION": "Gán quyền cho",
}
IMPORT_LABELS = {
    "SAN_PHAM": "sản phẩm", "NGUYEN_LIEU": "nguyên liệu", "CONG_THUC": "công thức / BOM",
    "TON_KHO": "tồn kho", "NHA_CUNG_CAP": "nhà cung cấp",
    "NGUYEN_LIEU_NCC": "nguyên liệu theo nhà cung cấp", "NGAY_LE": "ngày lễ", "DON_HANG": "đơn hàng",
}
PERMISSIONS = {
    f"{module}_{action}": {
        "module": module,
        "ten_quyen": f"Import {IMPORT_LABELS[action]}" if module == "IMPORT" else f"{ACTION_LABELS[action]} {MODULE_LABELS[module]}",
    }
    for module, actions in MODULE_ACTIONS.items() for action in actions
}

PERMISSIONS.update({"VIEW_SETTING": {"module": "SETTING","ten_quyen": "Xem cấu hình chung"},"VIEW_REASON_CONFIG": {"module": "REASON_CONFIG","ten_quyen": "Xem quản lý lý do"},"CREATE_REASON_CONFIG": {"module": "REASON_CONFIG","ten_quyen": "Tạo lý do"},"UPDATE_REASON_CONFIG": {"module": "REASON_CONFIG","ten_quyen": "Chỉnh sửa lý do"},"CHANGE_REASON_CONFIG_STATUS": {"module": "REASON_CONFIG","ten_quyen": "Đổi trạng thái lý do"},"VIEW_AUDIT_LOG": {"module": "SETTING","ten_quyen": "Xem nhật ký hoạt động"}})

DEFAULT_ROLES = {
    "ADMIN": "Quản trị viên",
    "NHAN_VIEN_BAN_HANG": "Nhân viên bán hàng",
    "QUAN_LY_BAN_HANG": "Quản lý bán hàng",
    "NHAN_VIEN_MUA_HANG": "Nhân viên mua hàng",
    "QUAN_LY_MUA_HANG": "Quản lý mua hàng",
}
LEGACY_ROLES = {
    "GIAM_SAT_BAN_HANG", "NHAN_VIEN_KE_HOACH_SAN_XUAT", "NHAN_VIEN_KHO", "QUAN_LY",
}
BUYER = {
    key for key, value in PERMISSIONS.items()
    if value["module"] in {
        "NGUYEN_LIEU", "CONG_THUC", "TON_KHO", "NHA_CUNG_CAP", "NGUYEN_LIEU_NCC",
        "NHU_CAU_NGUYEN_LIEU", "GOI_Y_NHA_CUNG_CAP", "DE_XUAT_NHAP_HANG", "DON_MUA",
    } and not key.endswith(("_APPROVE", "_REJECT"))
} | {
    "DU_BAO_VIEW", "IMPORT_NGUYEN_LIEU", "IMPORT_CONG_THUC", "IMPORT_TON_KHO",
    "IMPORT_NHA_CUNG_CAP", "IMPORT_NGUYEN_LIEU_NCC",
}
PURCHASE_MANAGER = {
    "NGUYEN_LIEU_VIEW", "CONG_THUC_VIEW", "TON_KHO_VIEW", "TON_KHO_HISTORY_VIEW",
    "NHA_CUNG_CAP_VIEW", "NHA_CUNG_CAP_PERFORMANCE_VIEW", "NGUYEN_LIEU_NCC_VIEW",
    "NHU_CAU_NGUYEN_LIEU_VIEW", "GOI_Y_NHA_CUNG_CAP_VIEW",
    "DE_XUAT_NHAP_HANG_VIEW", "DE_XUAT_NHAP_HANG_APPROVE", "DE_XUAT_NHAP_HANG_REJECT",
    "DON_MUA_VIEW", "DON_MUA_APPROVE", "DON_MUA_REJECT", "DASHBOARD_VIEW", "DU_BAO_VIEW",
}
DEFAULT_ROLE_PERMISSIONS = {
    "ADMIN": set(PERMISSIONS),
    "NHAN_VIEN_MUA_HANG": BUYER,
    "QUAN_LY_MUA_HANG": PURCHASE_MANAGER,
    "NHAN_VIEN_BAN_HANG": {"DU_BAO_VIEW", "DU_BAO_RUN", "IMPORT_DON_HANG"},
    "QUAN_LY_BAN_HANG": {"DU_BAO_VIEW", "DU_BAO_RUN", "IMPORT_SAN_PHAM", "IMPORT_NGAY_LE", "IMPORT_DON_HANG"},
}
