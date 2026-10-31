"""Additive, idempotent inventory upgrade; never reconstruct old movements."""
from sqlalchemy import text

INVENTORY_UPGRADE_SQL = """
SELECT pg_advisory_xact_lock(20261028, 1);
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ DECLARE constraint_row RECORD; BEGIN
    FOR constraint_row IN SELECT conname FROM pg_constraint
        WHERE conrelid = 'ly_do_chuc_nang'::regclass AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%chuc_nang%'
        AND pg_get_constraintdef(oid) NOT LIKE '%DIEU_CHINH_TON_KHO%'
    LOOP
        EXECUTE format('ALTER TABLE ly_do_chuc_nang DROP CONSTRAINT %I', constraint_row.conname);
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='ly_do_chuc_nang'::regclass
                   AND contype='c' AND pg_get_constraintdef(oid) LIKE '%DIEU_CHINH_TON_KHO%') THEN
        ALTER TABLE ly_do_chuc_nang ADD CONSTRAINT ck_ly_do_chuc_nang_inventory CHECK
        (chuc_nang IN ('DOI_TRANG_THAI_NGUYEN_LIEU','DOI_TRANG_THAI_CONG_THUC','DOI_TRANG_THAI_NHA_CUNG_CAP','DIEU_CHINH_TON_KHO'));
    END IF;
END $$;
INSERT INTO ly_do(id,ma_ly_do,ten_ly_do) VALUES
('LD_TK_DAU_KY','LD_TK_DAU_KY','Ghi nhận tồn đầu kỳ'),
('LD_TK_KIEM_KE','LD_TK_KIEM_KE','Chênh lệch kiểm kê'),
('LD_TK_KHAC','LD_TK_KHAC','Khác') ON CONFLICT DO NOTHING;
INSERT INTO ly_do_chuc_nang(id,ly_do_id,chuc_nang) VALUES
('LD_TK_DAU_KY_TK','LD_TK_DAU_KY','DIEU_CHINH_TON_KHO'),
('LD_TK_KIEM_KE_TK','LD_TK_KIEM_KE','DIEU_CHINH_TON_KHO'),
('LD_TK_KHAC_TK','LD_TK_KHAC','DIEU_CHINH_TON_KHO') ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION protect_reserved_production_plan() RETURNS trigger AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM giu_nguyen_lieu_san_xuat WHERE ma_ke_hoach=OLD.ma_ke_hoach)
       AND (NEW.ma_san_pham IS DISTINCT FROM OLD.ma_san_pham OR NEW.so_luong IS DISTINCT FROM OLD.so_luong) THEN
        RAISE EXCEPTION 'Ke hoach da giu/xuat nguyen lieu; khong sua san pham/so luong' USING ERRCODE='23514';
    END IF;
    IF NEW.trang_thai_san_xuat IS DISTINCT FROM OLD.trang_thai_san_xuat
       AND EXISTS (SELECT 1 FROM giu_nguyen_lieu_san_xuat WHERE ma_ke_hoach=OLD.ma_ke_hoach
                   AND da_huy='N' AND so_luong_xuat < so_luong_giu) THEN
        RAISE EXCEPTION 'Can xuat hoac huy phan nguyen lieu dang giu truoc khi doi trang thai ke hoach' USING ERRCODE='23514';
    END IF;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='protect_reserved_production_plan_trigger'
                   AND tgrelid='ke_hoach_san_xuat'::regclass) THEN
        CREATE TRIGGER protect_reserved_production_plan_trigger BEFORE UPDATE ON ke_hoach_san_xuat
        FOR EACH ROW EXECUTE FUNCTION protect_reserved_production_plan();
    END IF;
END $$;
INSERT INTO schema_migrations(version) VALUES ('20261028_inventory_ledger') ON CONFLICT DO NOTHING;
"""


def upgrade_inventory_schema(engine):
    with engine.begin() as connection:
        connection.execute(text("SELECT pg_advisory_xact_lock(20261028, 1)"))
        if connection.scalar(text("SELECT to_regclass('schema_migrations')")) is not None:
            if connection.scalar(text("SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version='20261028_inventory_ledger')")):
                return
        connection.execute(text(INVENTORY_UPGRADE_SQL))
