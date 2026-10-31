BEGIN;
SET LOCAL lock_timeout = '5s';
SELECT pg_advisory_xact_lock(20261030, 1);

-- Preserve every existing receipt. NULL means no historical price evidence.
ALTER TABLE chi_tiet_phieu_nhan_nguyen_lieu
    ADD COLUMN IF NOT EXISTS don_gia_mua NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS don_vi_don_gia VARCHAR(20),
    ADD COLUMN IF NOT EXISTS thanh_tien NUMERIC(30, 4)
        GENERATED ALWAYS AS (so_luong_nhap_kho * don_gia_mua) STORED;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'chi_tiet_phieu_nhan_nguyen_lieu'::regclass
          AND conname = 'ck_phieu_nhan_gia_snapshot'
    ) THEN
        ALTER TABLE chi_tiet_phieu_nhan_nguyen_lieu
            ADD CONSTRAINT ck_phieu_nhan_gia_snapshot CHECK (
                (don_gia_mua IS NULL AND don_vi_don_gia IS NULL) OR
                (don_gia_mua IS NOT NULL AND don_gia_mua >= 0
                 AND don_vi_don_gia IS NOT NULL AND don_vi_don_gia = don_vi)
            );
    END IF;
END $$;

INSERT INTO schema_migrations(version) VALUES ('20261030_delivery_prices') ON CONFLICT DO NOTHING;
COMMIT;
