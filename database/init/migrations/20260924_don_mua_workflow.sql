BEGIN;

ALTER TABLE don_mua_nguyen_lieu
    ADD COLUMN IF NOT EXISTS nguoi_duyet VARCHAR(20),
    ADD COLUMN IF NOT EXISTS thoi_gian_duyet TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ly_do_tu_choi TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'don_mua_nguyen_lieu'::regclass
          AND conname = 'fk_don_mua_nguoi_duyet'
    ) THEN
        ALTER TABLE don_mua_nguyen_lieu
            ADD CONSTRAINT fk_don_mua_nguoi_duyet
            FOREIGN KEY (nguoi_duyet) REFERENCES users(ma_nguoi_dung);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'don_mua_nguyen_lieu'::regclass
          AND conname = 'ck_don_mua_workflow'
    ) THEN
        ALTER TABLE don_mua_nguyen_lieu
            ADD CONSTRAINT ck_don_mua_workflow CHECK (
                trang_thai = 'DA_NHAN_HANG'
                OR (
                    trang_thai = 'CHUA_DUYET'
                    AND nguoi_duyet IS NULL
                    AND thoi_gian_duyet IS NULL
                    AND ly_do_tu_choi IS NULL
                ) OR (
                    trang_thai = 'DA_DUYET'
                    AND nguoi_duyet IS NOT NULL
                    AND thoi_gian_duyet IS NOT NULL
                    AND ly_do_tu_choi IS NULL
                ) OR (
                    trang_thai = 'TU_CHOI'
                    AND nguoi_duyet IS NOT NULL
                    AND thoi_gian_duyet IS NOT NULL
                    AND NULLIF(BTRIM(ly_do_tu_choi), '') IS NOT NULL
                )
            );
    END IF;
END
$$;

COMMIT;
