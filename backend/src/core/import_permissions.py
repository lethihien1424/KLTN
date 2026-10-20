IMPORT_PERMISSIONS = {
    # Quản trị viên - toàn quyền import
    "ADMIN": {
        "ALL",
    },

    # Quản lý bán hàng
    "QUAN_LY_BAN_HANG": {
        "san_pham",
        "nha_cung_cap",
        "nguyen_lieu_nha_cung_cap",
        "ngay_le",
        "don_hang",
        "ctkm",
    },

    # Quản lý mua hàng
    "QUAN_LY_MUA_HANG": {
        "nguyen_lieu",
        "nha_cung_cap",
        "nguyen_lieu_nha_cung_cap",
        "ton_kho_nguyen_lieu",
    },

    # Nhân viên bán hàng
    "NHAN_VIEN_BAN_HANG": {
        "don_hang",
        "ctkm",
    },

    # Nhân viên mua hàng
    "NHAN_VIEN_MUA_HANG": {
        "nguyen_lieu",
        "nha_cung_cap",
    },
}


def can_import(
    role: str,
    import_type: str,
) -> bool:
    allowed_types = IMPORT_PERMISSIONS.get(
        role,
        set(),
    )

    # ADMIN có toàn quyền import
    if "ALL" in allowed_types:
        return True

    # Các vai trò khác theo quyền được cấp
    return import_type in allowed_types
