BEGIN;
SELECT pg_advisory_xact_lock(20261029,1);

CREATE TABLE IF NOT EXISTS phieu_nhan_nguyen_lieu (
	ma_phieu_nhan VARCHAR(32) NOT NULL,
	request_id VARCHAR(64) NOT NULL,
	request_payload JSON,
	ma_don_mua VARCHAR(20),
	ma_ncc VARCHAR(20) NOT NULL,
	nguon VARCHAR(15) NOT NULL,
	ma_don_cu VARCHAR(80),
	lan_giao_cu VARCHAR(80),
	ngay_dat_hang DATE NOT NULL,
	ngay_du_kien_giao DATE NOT NULL,
	ngay_giao_thuc_te DATE NOT NULL,
	hoan_tat BOOLEAN NOT NULL,
	nguoi_xac_nhan VARCHAR(20) NOT NULL,
	ghi_chu VARCHAR(2000),
	thoi_gian TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
	PRIMARY KEY (ma_phieu_nhan),
	CONSTRAINT uq_phieu_nhan_lich_su UNIQUE (ma_ncc, ma_don_cu, lan_giao_cu),
	CHECK (ngay_du_kien_giao >= ngay_dat_hang AND ngay_giao_thuc_te >= ngay_dat_hang),
	CHECK ((nguon='THUC_TE' AND ma_don_mua IS NOT NULL AND ma_don_cu IS NULL) OR (nguon='LICH_SU' AND ma_don_mua IS NULL AND ma_don_cu IS NOT NULL AND lan_giao_cu IS NOT NULL)),
	UNIQUE (request_id),
	FOREIGN KEY(ma_don_mua) REFERENCES don_mua_nguyen_lieu (ma_don_mua),
	FOREIGN KEY(ma_ncc) REFERENCES nha_cung_cap (ma_ncc),
	FOREIGN KEY(nguoi_xac_nhan) REFERENCES users (ma_nguoi_dung)
)

;
CREATE INDEX IF NOT EXISTS ix_phieu_nhan_nguyen_lieu_ma_ncc ON phieu_nhan_nguyen_lieu (ma_ncc);
CREATE INDEX IF NOT EXISTS ix_phieu_nhan_nguyen_lieu_ma_don_mua ON phieu_nhan_nguyen_lieu (ma_don_mua);

CREATE TABLE IF NOT EXISTS chi_tiet_phieu_nhan_nguyen_lieu (
	id VARCHAR(32) NOT NULL,
	ma_phieu_nhan VARCHAR(32) NOT NULL,
	ma_chi_tiet_don_mua VARCHAR(20),
	ma_nguyen_lieu VARCHAR(20) NOT NULL,
	don_vi VARCHAR(20) NOT NULL,
	so_luong_dat NUMERIC(14, 2) NOT NULL,
	so_luong_giao NUMERIC(14, 2) NOT NULL,
	so_luong_dat_chat_luong NUMERIC(14, 2),
	so_luong_khong_dat NUMERIC(14, 2),
	so_luong_nhap_kho NUMERIC(14, 2) NOT NULL,
	ly_do VARCHAR(2000),
	ma_giao_dich_kho VARCHAR(32),
	PRIMARY KEY (id),
	UNIQUE (ma_phieu_nhan, ma_nguyen_lieu),
	CHECK (so_luong_dat > 0 AND so_luong_giao >= 0 AND so_luong_nhap_kho >= 0 AND so_luong_nhap_kho <= so_luong_giao),
	CHECK ((so_luong_dat_chat_luong IS NULL AND so_luong_khong_dat IS NULL) OR (so_luong_dat_chat_luong IS NOT NULL AND so_luong_khong_dat IS NOT NULL AND so_luong_dat_chat_luong >= 0 AND so_luong_khong_dat >= 0 AND so_luong_dat_chat_luong + so_luong_khong_dat = so_luong_giao AND so_luong_nhap_kho <= so_luong_dat_chat_luong)),
	FOREIGN KEY(ma_phieu_nhan) REFERENCES phieu_nhan_nguyen_lieu (ma_phieu_nhan),
	FOREIGN KEY(ma_chi_tiet_don_mua) REFERENCES chi_tiet_don_mua (ma_chi_tiet_don_mua),
	FOREIGN KEY(ma_nguyen_lieu) REFERENCES nguyen_lieu (ma_nguyen_lieu),
	FOREIGN KEY(ma_giao_dich_kho) REFERENCES giao_dich_ton_kho (id)
)

;
CREATE INDEX IF NOT EXISTS ix_chi_tiet_phieu_nhan_nguyen_lieu_ma_phieu_nhan ON chi_tiet_phieu_nhan_nguyen_lieu (ma_phieu_nhan);
INSERT INTO schema_migrations(version) VALUES ('20261029_delivery_history') ON CONFLICT DO NOTHING;
COMMIT;
