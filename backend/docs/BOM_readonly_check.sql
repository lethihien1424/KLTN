-- Run against the intended database. These queries do not modify data.
BEGIN TRANSACTION READ ONLY;

SELECT ct.ma_cong_thuc, ct.ma_san_pham, ct.trang_thai,
       d.ma_nguyen_lieu, n.ten_nguyen_lieu, d.ty_le_phoi_tron,
       NOT EXISTS (SELECT 1 FROM ton_kho_nguyen_lieu t
                   WHERE t.ma_nguyen_lieu = d.ma_nguyen_lieu) AS thieu_snapshot
FROM cong_thuc ct
JOIN chi_tiet_cong_thuc d USING (ma_cong_thuc)
LEFT JOIN nguyen_lieu n USING (ma_nguyen_lieu)
WHERE d.ma_nguyen_lieu ~* '(test|demo|cfg)'
   OR n.ten_nguyen_lieu ~* '(test|demo|kiểm thử)'
   OR NOT EXISTS (SELECT 1 FROM ton_kho_nguyen_lieu t
                  WHERE t.ma_nguyen_lieu = d.ma_nguyen_lieu)
ORDER BY ct.ma_cong_thuc, d.ma_nguyen_lieu;

SELECT ct.ma_cong_thuc, ct.ma_san_pham, ct.trang_thai,
       COUNT(d.ma_nguyen_lieu) AS so_nguyen_lieu,
       SUM(d.ty_le_phoi_tron) AS tong_ty_le
FROM cong_thuc ct LEFT JOIN chi_tiet_cong_thuc d USING (ma_cong_thuc)
GROUP BY ct.ma_cong_thuc, ct.ma_san_pham, ct.trang_thai
HAVING SUM(d.ty_le_phoi_tron) IS DISTINCT FROM 1.0000;

SELECT thoi_gian, ma_nguoi_dung, hanh_dong, ma_doi_tuong,
       du_lieu_truoc, du_lieu_sau, mo_ta
FROM nhat_ky_hoat_dong
WHERE ma_doi_tuong IN ('CT0003', 'NLTEST01')
   OR CAST(du_lieu_truoc AS text) LIKE '%NLTEST01%'
   OR CAST(du_lieu_sau AS text) LIKE '%NLTEST01%'
ORDER BY thoi_gian;

ROLLBACK;
