BEGIN;

ALTER TABLE de_xuat_nhap_hang
    ADD COLUMN IF NOT EXISTS trang_thai VARCHAR(30),
    ADD COLUMN IF NOT EXISTS nguoi_tao VARCHAR(20),
    ADD COLUMN IF NOT EXISTS nguoi_duyet VARCHAR(20),
    ADD COLUMN IF NOT EXISTS thoi_gian_duyet TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ly_do_tu_choi TEXT;

-- Historical rows have no trustworthy creator metadata. Preserve NULL creator.
UPDATE de_xuat_nhap_hang
SET trang_thai = 'CHO_DUYET'
WHERE trang_thai IS NULL;

ALTER TABLE de_xuat_nhap_hang
    ALTER COLUMN trang_thai SET DEFAULT 'CHO_DUYET',
    ALTER COLUMN trang_thai SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'de_xuat_nhap_hang'::regclass
          AND conname = 'ck_de_xuat_nhap_hang_workflow'
    ) THEN
        ALTER TABLE de_xuat_nhap_hang
            ADD CONSTRAINT ck_de_xuat_nhap_hang_workflow CHECK (
                (
                    trang_thai = 'CHO_DUYET'
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

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'de_xuat_nhap_hang'::regclass
          AND conname = 'fk_de_xuat_nhap_hang_nguoi_tao'
    ) THEN
        ALTER TABLE de_xuat_nhap_hang
            ADD CONSTRAINT fk_de_xuat_nhap_hang_nguoi_tao
            FOREIGN KEY (nguoi_tao) REFERENCES users(ma_nguoi_dung);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'de_xuat_nhap_hang'::regclass
          AND conname = 'fk_de_xuat_nhap_hang_nguoi_duyet'
    ) THEN
        ALTER TABLE de_xuat_nhap_hang
            ADD CONSTRAINT fk_de_xuat_nhap_hang_nguoi_duyet
            FOREIGN KEY (nguoi_duyet) REFERENCES users(ma_nguoi_dung);
    END IF;
END
$$;

COMMIT;
