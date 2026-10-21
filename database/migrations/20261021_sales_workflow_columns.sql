-- Upgrade the legacy consumption history for the sales workflow.
BEGIN;
ALTER TABLE lich_su_tieu_thu
    ADD COLUMN IF NOT EXISTS ngay_giao_hang DATE,
    ADD COLUMN IF NOT EXISTS ma_ctkm VARCHAR(30)
        REFERENCES chuong_trinh_khuyen_mai(ma_ctkm) ON DELETE RESTRICT,
    -- Legacy consumption records represent completed sales.
    ADD COLUMN IF NOT EXISTS trang_thai_don_hang VARCHAR(30)
        NOT NULL DEFAULT 'DA_GIAO_HANG'
        CHECK (trang_thai_don_hang IN ('CHO_GIAO_HANG', 'DA_GIAO_HANG')),
    ADD COLUMN IF NOT EXISTS ma_ke_hoach_nguon VARCHAR(20);
ALTER TABLE lich_su_tieu_thu
    ALTER COLUMN trang_thai_don_hang SET DEFAULT 'CHO_GIAO_HANG',
    ALTER COLUMN trang_thai_san_xuat SET DEFAULT 'CHO_SAN_XUAT',
    ALTER COLUMN ngay_ban DROP NOT NULL;
ALTER TABLE lich_su_tieu_thu
    DROP CONSTRAINT IF EXISTS lich_su_tieu_thu_trang_thai_san_xuat_check;
ALTER TABLE lich_su_tieu_thu
    ADD CONSTRAINT lich_su_tieu_thu_trang_thai_san_xuat_check
    CHECK (trang_thai_san_xuat IN ('CHO_SAN_XUAT', 'DANG_SAN_XUAT', 'DA_SAN_XUAT'));
CREATE INDEX IF NOT EXISTS ix_lstt_ctkm ON lich_su_tieu_thu (ma_ctkm);
CREATE UNIQUE INDEX IF NOT EXISTS uq_lstt_ke_hoach_nguon
    ON lich_su_tieu_thu (ma_ke_hoach_nguon) WHERE ma_ke_hoach_nguon IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_lstt_trang_thai_ngay
    ON lich_su_tieu_thu (trang_thai_don_hang, ngay_ban);
COMMIT;
