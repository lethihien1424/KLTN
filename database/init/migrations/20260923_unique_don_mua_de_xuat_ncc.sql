BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM don_mua_nguyen_lieu
        WHERE ma_de_xuat IS NOT NULL
        GROUP BY ma_de_xuat, ma_ncc
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot add unique constraint: duplicate (ma_de_xuat, ma_ncc) exists';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'don_mua_nguyen_lieu'::regclass
          AND conname = 'uq_don_mua_de_xuat_ncc'
    ) THEN
        ALTER TABLE don_mua_nguyen_lieu
            ADD CONSTRAINT uq_don_mua_de_xuat_ncc
            UNIQUE (ma_de_xuat, ma_ncc);
    END IF;
END
$$;

COMMIT;
