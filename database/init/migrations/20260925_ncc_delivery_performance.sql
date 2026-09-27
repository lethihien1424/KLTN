BEGIN;

ALTER TABLE nha_cung_cap
    ADD COLUMN IF NOT EXISTS ty_le_giao_dung_han_thuc_te NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS ty_le_giao_du_thuc_te NUMERIC(5,2);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'nha_cung_cap'::regclass
          AND conname = 'ck_ncc_delivery_performance'
    ) THEN
        ALTER TABLE nha_cung_cap
            ADD CONSTRAINT ck_ncc_delivery_performance CHECK (
                (ty_le_giao_dung_han_thuc_te IS NULL OR
                 ty_le_giao_dung_han_thuc_te BETWEEN 0 AND 100)
                AND
                (ty_le_giao_du_thuc_te IS NULL OR
                 ty_le_giao_du_thuc_te BETWEEN 0 AND 100)
            );
    END IF;
END
$$;

COMMIT;
