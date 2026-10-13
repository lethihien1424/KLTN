BEGIN;
ALTER TABLE nhat_ky_hoat_dong
    ADD COLUMN IF NOT EXISTS module VARCHAR(80),
    ADD COLUMN IF NOT EXISTS chuc_nang VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ma_doi_tuong VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ten_nguoi_thao_tac VARCHAR(255),
    ADD COLUMN IF NOT EXISTS du_lieu_truoc JSON,
    ADD COLUMN IF NOT EXISTS du_lieu_sau JSON;
CREATE INDEX IF NOT EXISTS ix_audit_time ON nhat_ky_hoat_dong (thoi_gian DESC, ma_nhat_ky DESC);
CREATE INDEX IF NOT EXISTS ix_audit_module_action ON nhat_ky_hoat_dong (module, hanh_dong);
CREATE INDEX IF NOT EXISTS ix_audit_actor_time ON nhat_ky_hoat_dong (ma_nguoi_dung, thoi_gian DESC);
CREATE INDEX IF NOT EXISTS ix_audit_object ON nhat_ky_hoat_dong (ma_doi_tuong);
-- Preserve older status-change snapshots and enable filtering of those records.
DO $$
DECLARE entry RECORD; snapshot JSONB;
BEGIN
    FOR entry IN SELECT ma_nhat_ky, hanh_dong, mo_ta FROM nhat_ky_hoat_dong WHERE module IS NULL LOOP
        BEGIN
            snapshot := entry.mo_ta::JSONB;
        EXCEPTION WHEN invalid_text_representation THEN
            snapshot := '{}'::JSONB;
        END;
        UPDATE nhat_ky_hoat_dong SET
            module = CASE
                WHEN entry.hanh_dong IN ('DOI_TRANG_THAI_NGUYEN_LIEU', 'DOI_TRANG_THAI_CONG_THUC') THEN 'Nguyên liệu'
                WHEN entry.hanh_dong = 'DOI_TRANG_THAI_NHA_CUNG_CAP' THEN 'Nhà cung cấp'
                ELSE snapshot->>'module' END,
            chuc_nang = CASE entry.hanh_dong
                WHEN 'DOI_TRANG_THAI_NGUYEN_LIEU' THEN 'Nguyên liệu'
                WHEN 'DOI_TRANG_THAI_CONG_THUC' THEN 'Công thức / BOM'
                WHEN 'DOI_TRANG_THAI_NHA_CUNG_CAP' THEN 'Nhà cung cấp'
                ELSE snapshot->>'chuc_nang' END,
            ma_doi_tuong = snapshot->>'doi_tuong',
            du_lieu_truoc = CASE WHEN snapshot ? 'trang_thai_cu' THEN json_build_object('trang_thai', snapshot->'trang_thai_cu') ELSE NULL END,
            du_lieu_sau = CASE WHEN snapshot ? 'trang_thai_moi' THEN json_build_object('trang_thai', snapshot->'trang_thai_moi') ELSE NULL END
        WHERE ma_nhat_ky = entry.ma_nhat_ky;
    END LOOP;
END $$;
COMMIT;
