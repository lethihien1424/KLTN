"""Import operations mapped to capability keys, independent of roles."""

IMPORT_PERMISSIONS = {
    "users": {"USER_IMPORT", "USER_ASSIGN_ROLE"},
    "san_pham": {"IMPORT_SAN_PHAM"},
    "nguyen_lieu": {"IMPORT_NGUYEN_LIEU"},
    "cong_thuc": {"IMPORT_CONG_THUC"},
    "ton_kho_nguyen_lieu": {"IMPORT_TON_KHO"},
    "nha_cung_cap": {"IMPORT_NHA_CUNG_CAP"},
    "nguyen_lieu_nha_cung_cap": {"IMPORT_NGUYEN_LIEU_NCC"},
    "ngay_le": {"IMPORT_NGAY_LE"},
    "don_hang": {"IMPORT_DON_HANG"},
}


def can_import(permissions, import_type: str) -> bool:
    required = IMPORT_PERMISSIONS.get(import_type)
    return required is not None and required.issubset(permissions)
