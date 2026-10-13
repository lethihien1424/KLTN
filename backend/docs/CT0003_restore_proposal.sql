-- PROPOSAL ONLY: not executed. Run only after approval, on the intended DB.
-- Source: backend/data/07_cong_thuc_va_chi_tiet_cong_thuc_Milano_day_du.xlsx
-- Data rows 6-7; Git e72ae3b (2026-09-12).
-- Export the original cong_thuc and chi_tiet_cong_thuc rows before running.
BEGIN;
LOCK TABLE cong_thuc, chi_tiet_cong_thuc IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM cong_thuc
        WHERE ma_cong_thuc = 'CT0003' AND ma_san_pham = 'SP0003'
          AND he_so_thu_hoi = 0.8600 AND ty_le_hao_hut = 0.1400
    ) THEN
        RAISE EXCEPTION 'CT0003 identity/yield differs; stop and review';
    END IF;
    IF (SELECT COUNT(*) FROM chi_tiet_cong_thuc WHERE ma_cong_thuc = 'CT0003') <> 3
       OR (SELECT COUNT(*) FROM chi_tiet_cong_thuc
           WHERE ma_cong_thuc = 'CT0003' AND (
               (ma_nguyen_lieu = 'NL0001' AND ty_le_phoi_tron = 0.1000)
               OR (ma_nguyen_lieu = 'NL0003' AND ty_le_phoi_tron = 0.8000)
               OR (ma_nguyen_lieu = 'NLTEST01' AND ty_le_phoi_tron = 0.1000)
           )) <> 3 THEN
        RAISE EXCEPTION 'CT0003 details differ from reported state; stop and review';
    END IF;

    UPDATE chi_tiet_cong_thuc
    SET ty_le_phoi_tron = CASE ma_nguyen_lieu
        WHEN 'NL0001' THEN 0.1500 WHEN 'NL0003' THEN 0.8500 END
    WHERE ma_cong_thuc = 'CT0003' AND ma_nguyen_lieu IN ('NL0001', 'NL0003');

    DELETE FROM chi_tiet_cong_thuc
    WHERE ma_cong_thuc = 'CT0003' AND ma_nguyen_lieu = 'NLTEST01';

    IF (SELECT COUNT(*) FROM chi_tiet_cong_thuc WHERE ma_cong_thuc = 'CT0003') <> 2
       OR (SELECT SUM(ty_le_phoi_tron) FROM chi_tiet_cong_thuc
           WHERE ma_cong_thuc = 'CT0003') IS DISTINCT FROM 1.0000 THEN
        RAISE EXCEPTION 'Restored BOM failed validation';
    END IF;
    UPDATE cong_thuc SET thoi_gian_cap_nhat = CURRENT_TIMESTAMP
    WHERE ma_cong_thuc = 'CT0003';
END $$;

SELECT * FROM chi_tiet_cong_thuc WHERE ma_cong_thuc = 'CT0003'
ORDER BY ma_nguyen_lieu;

-- Preview defaults to rollback. Replace with COMMIT only after approval/review.
ROLLBACK;
