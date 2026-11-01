-- Extend reason applicability only; do not seed reasons, scores or receipt history.
BEGIN;
DO $$
DECLARE constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'ly_do_chuc_nang'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%chuc_nang%'
  LOOP
    EXECUTE format('ALTER TABLE ly_do_chuc_nang DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;
ALTER TABLE ly_do_chuc_nang ADD CONSTRAINT ck_ly_do_chuc_nang_supported
  CHECK (chuc_nang IN ('DOI_TRANG_THAI_NGUYEN_LIEU','DOI_TRANG_THAI_CONG_THUC',
    'DOI_TRANG_THAI_NHA_CUNG_CAP','DIEU_CHINH_TON_KHO','TINH_LAI_DIEM_NCC'));
COMMIT;
