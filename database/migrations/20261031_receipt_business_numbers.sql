-- Run as one transaction. UUIDs and all business values are preserved.
BEGIN;

SELECT pg_advisory_xact_lock(20261031, 1);
LOCK TABLE phieu_nhan_nguyen_lieu IN ACCESS EXCLUSIVE MODE;
CREATE SEQUENCE IF NOT EXISTS phieu_nhap_number_seq AS BIGINT START WITH 1 NO CYCLE;
ALTER TABLE phieu_nhan_nguyen_lieu ADD COLUMN IF NOT EXISTS ma_phieu_nhap VARCHAR(32);
DO $$
DECLARE highest BIGINT; allocated BIGINT; number BIGINT; receipt RECORD;
BEGIN
    SELECT COALESCE(MAX(substring(ma_phieu_nhap FROM 3)::bigint), 0) INTO highest
    FROM phieu_nhan_nguyen_lieu WHERE ma_phieu_nhap ~ '^PN[0-9]{4,}$';
    SELECT CASE WHEN is_called THEN last_value ELSE 0 END INTO allocated FROM phieu_nhap_number_seq;
    -- Preserve numbers consumed by rolled-back transactions, even on reruns.
    IF GREATEST(highest, allocated) > 0 THEN
        PERFORM setval('phieu_nhap_number_seq', GREATEST(highest, allocated), true);
    END IF;
    FOR receipt IN SELECT ma_phieu_nhan FROM phieu_nhan_nguyen_lieu
        WHERE ma_phieu_nhap IS NULL
        ORDER BY ngay_giao_thuc_te, thoi_gian, ma_phieu_nhan
    LOOP
        number := nextval('phieu_nhap_number_seq');
        UPDATE phieu_nhan_nguyen_lieu
        SET ma_phieu_nhap = 'PN' || lpad(number::text, GREATEST(4, length(number::text)), '0')
        WHERE ma_phieu_nhan = receipt.ma_phieu_nhan;
    END LOOP;
END $$;
ALTER TABLE phieu_nhan_nguyen_lieu ALTER COLUMN ma_phieu_nhap SET DEFAULT
    'PN' || CASE WHEN nextval('phieu_nhap_number_seq') < 10000
    THEN lpad(currval('phieu_nhap_number_seq')::text, 4, '0')
    ELSE currval('phieu_nhap_number_seq')::text END;
ALTER TABLE phieu_nhan_nguyen_lieu ALTER COLUMN ma_phieu_nhap SET NOT NULL;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'phieu_nhan_nguyen_lieu'::regclass
                   AND conname = 'uq_phieu_nhan_ma_phieu_nhap') THEN
        ALTER TABLE phieu_nhan_nguyen_lieu ADD CONSTRAINT uq_phieu_nhan_ma_phieu_nhap UNIQUE (ma_phieu_nhap);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'phieu_nhan_nguyen_lieu'::regclass
                   AND conname = 'ck_phieu_nhan_ma_phieu_nhap') THEN
        ALTER TABLE phieu_nhan_nguyen_lieu ADD CONSTRAINT ck_phieu_nhan_ma_phieu_nhap
            CHECK (ma_phieu_nhap ~ '^PN[0-9]{4,}$');
    END IF;
END $$;

COMMIT;
