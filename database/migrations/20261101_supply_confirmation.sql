-- Additive, no stock/mapping/order/receipt data is rewritten.
CREATE TABLE IF NOT EXISTS xac_nhan_cung_ung (
 id VARCHAR(32) PRIMARY KEY,
 ma_nguyen_lieu_ncc VARCHAR(20) NOT NULL REFERENCES nguyen_lieu_nha_cung_cap(ma_nguyen_lieu_ncc),
 ma_lich_su_du_bao VARCHAR(20) REFERENCES lich_su_du_bao(ma_lich_su_du_bao),
 so_luong_can_mua NUMERIC(14,2) NOT NULL CHECK (so_luong_can_mua>0),
 so_luong_xac_nhan NUMERIC(14,2) NOT NULL CHECK (so_luong_xac_nhan>=0),
 ngay_xac_nhan TIMESTAMPTZ NOT NULL,
 hieu_luc_den TIMESTAMPTZ NOT NULL CHECK (hieu_luc_den>ngay_xac_nhan),
 nguoi_xac_nhan VARCHAR(20) NOT NULL REFERENCES users(ma_nguoi_dung),
 nguon_xac_nhan VARCHAR(50) NOT NULL,
 ly_do VARCHAR(500) NOT NULL,
 ghi_chu TEXT,
 thoi_gian TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_xac_nhan_cung_ung_scope ON xac_nhan_cung_ung(ma_nguyen_lieu_ncc,ma_lich_su_du_bao,thoi_gian DESC);
ALTER TABLE de_xuat_nhap_hang
 ADD COLUMN IF NOT EXISTS ma_lich_su_du_bao VARCHAR(20) REFERENCES lich_su_du_bao(ma_lich_su_du_bao),
 ADD COLUMN IF NOT EXISTS yeu_cau_xac_nhan BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS ly_do_chua_xac_nhan TEXT;
ALTER TABLE chi_tiet_de_xuat_nhap_hang
 ADD COLUMN IF NOT EXISTS ma_xac_nhan VARCHAR(32) REFERENCES xac_nhan_cung_ung(id),
 ADD COLUMN IF NOT EXISTS trang_thai_cung_ung VARCHAR(30);
-- Existing proposals retain legacy workflow. All newly created proposals opt in in the service.
-- No confirmations are seeded for old/demo supply mappings; their status is CHUA_XAC_NHAN.
