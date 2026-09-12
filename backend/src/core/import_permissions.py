IMPORT_PERMISSIONS = {
    "ADMIN": {
        "users",
        "san_pham",
        "nguyen_lieu",
        "nha_cung_cap",
        "nguyen_lieu_nha_cung_cap",
        "ton_kho_nguyen_lieu",
        "ngay_le",
        "cong_thuc",
        "don_hang",
    },

    "QUAN_LY": {
        "san_pham",
        "nguyen_lieu",
        "nha_cung_cap",
        "nguyen_lieu_nha_cung_cap",
        "ton_kho_nguyen_lieu",
        "ngay_le",
        "cong_thuc",
        "don_hang",
    },

    "GIAM_SAT_BAN_HANG": {
        "don_hang",
    },

    "NHAN_VIEN_KE_HOACH_SAN_XUAT": {
        "cong_thuc",
    },

    "NHAN_VIEN_KHO": {
        "nguyen_lieu",
        "nha_cung_cap",
        "nguyen_lieu_nha_cung_cap",
        "ton_kho_nguyen_lieu",
    },

    "NHAN_VIEN_MUA_HANG": set(),
}


def can_import(
    role: str,
    import_type: str,
) -> bool:
    return import_type in IMPORT_PERMISSIONS.get(
        role,
        set(),
    )