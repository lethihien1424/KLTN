-- ============================================================
-- CƠ SỞ DỮ LIỆU DỰ BÁO NHU CẦU VÀ LẬP KẾ HOẠCH NHẬP HÀNG
-- Hệ quản trị: PostgreSQL (sử dụng được khi PostgreSQL chạy Docker)
-- ============================================================
-- CÁC KHÓA NGOẠI SUY RA TỪ ĐƯỜNG NỐI TRONG DOMAIN MODEL:
-- lich_su_tieu_thu.ma_san_pham              -> san_pham.ma_san_pham
-- cong_thuc.ma_san_pham                     -> san_pham.ma_san_pham
-- phien_ban_cong_thuc.ma_cong_thuc          -> cong_thuc.ma_cong_thuc
-- chi_tiet_cong_thuc.ma_phien_ban           -> phien_ban_cong_thuc.ma_phien_ban
-- chi_tiet_cong_thuc.ma_nguyen_lieu         -> ton_kho_nguyen_lieu.ma_nguyen_lieu
-- nguyen_lieu_nha_cung_cap.ma_ncc           -> nha_cung_cap.ma_ncc
-- nguyen_lieu_nha_cung_cap.ma_nguyen_lieu   -> ton_kho_nguyen_lieu.ma_nguyen_lieu
-- don_mua_nguyen_lieu.ma_ncc                -> nha_cung_cap.ma_ncc
-- don_mua_nguyen_lieu.nguoi_tao             -> tai_khoan.ten_dang_nhap
-- chi_tiet_don_mua.ma_don_mua               -> don_mua_nguyen_lieu.ma_don_mua
-- chi_tiet_don_mua.ma_nguyen_lieu           -> ton_kho_nguyen_lieu.ma_nguyen_lieu
-- chi_tiet_lich_su_du_bao.ma_lich_su_du_bao -> lich_su_du_bao.ma_lich_su_du_bao
-- chi_tiet_lich_su_du_bao.ma_san_pham       -> san_pham.ma_san_pham
-- Bảng ngay_le không có đường nối trong domain model nên không có khóa ngoại.

BEGIN;

-- Tài khoản
CREATE TABLE tai_khoan (
    ten_dang_nhap VARCHAR(50) PRIMARY KEY,
    mat_khau VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    vai_tro VARCHAR(50) NOT NULL,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'DANG_HOAT_DONG'
);

-- Sản phẩm
CREATE TABLE san_pham (
    ma_san_pham VARCHAR(20) PRIMARY KEY,
    ten_san_pham VARCHAR(150) NOT NULL,
    don_gia NUMERIC(15,2)
        CHECK (don_gia >= 0)
    khoi_luong_kg NUMERIC(10,3) NOT NULL
        CHECK (khoi_luong_kg > 0),
    quy_cach VARCHAR(50),
    nhom_san_pham VARCHAR(100),
    trang_thai VARCHAR(30) NOT NULL,
    
);

-- Tồn kho nguyên liệu
-- Theo domain model, bảng này đồng thời lưu thông tin nguyên liệu và số liệu tồn kho.
CREATE TABLE ton_kho_nguyen_lieu (
    ma_nguyen_lieu VARCHAR(20) PRIMARY KEY,
    ten_nguyen_lieu VARCHAR(100) NOT NULL,
    ton_kho_thuc_te NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (ton_kho_thuc_te >= 0),
    so_luong_su_dung NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (so_luong_su_dung >= 0),
    ton_kho_kha_dung_kg NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (ton_kho_kha_dung_kg >= 0),
    ton_kho_toi_da_kg NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (ton_kho_toi_da_kg >= 0),

    CHECK (ton_kho_kha_dung_kg <= ton_kho_thuc_te),
    CHECK (ton_kho_thuc_te <= ton_kho_toi_da_kg)
);

-- Nhà cung cấp
CREATE TABLE nha_cung_cap (
    ma_ncc VARCHAR(20) PRIMARY KEY,
    ten_ncc VARCHAR(150) NOT NULL,
    trang_thai VARCHAR(30) NOT NULL,
    diem_dieu_kien_thuong_mai NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (diem_dieu_kien_thuong_mai BETWEEN 0 AND 100)
);

-- Ngày lễ
CREATE TABLE ngay_le (
    ma_ngay_le VARCHAR(20) PRIMARY KEY,
    ten_ngay_le VARCHAR(150) NOT NULL,
    ngay_bat_dau DATE NOT NULL,
    ngay_ket_thuc DATE NOT NULL,
    loai_ngay_le VARCHAR(50) NOT NULL,

    CHECK (ngay_ket_thuc >= ngay_bat_dau)
);

-- Lịch sử tiêu thụ
CREATE TABLE lich_su_tieu_thu (
    ma_lich_su VARCHAR(20) PRIMARY KEY,
    ma_san_pham VARCHAR(20) NOT NULL, -- FK -> san_pham
    ngay_ban DATE NOT NULL,
    so_luong_ban INTEGER NOT NULL
        CHECK (so_luong_ban >= 0),
    gia_ban_sau_giam NUMERIC(15,2)
        CHECK (gia_ban_sau_giam >= 0),
    muc_giam_gia NUMERIC(5,4) NOT NULL DEFAULT 0
        CHECK (muc_giam_gia BETWEEN 0 AND 1),
    co_khuyen_mai BOOLEAN NOT NULL DEFAULT FALSE,
    chuong_trinh_km VARCHAR(150),
    kenh_ban_hang VARCHAR(50),
    trang_thai_don VARCHAR(30) NOT NULL,
    so_luong_tra_lai INTEGER NOT NULL DEFAULT 0
        CHECK (
            so_luong_tra_lai >= 0
            AND so_luong_tra_lai <= so_luong_ban
        ),

    CONSTRAINT fk_tieu_thu_san_pham
        FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham),

    CONSTRAINT uq_tieu_thu_san_pham_ngay
        UNIQUE (ma_san_pham, ngay_ban)
);

-- Công thức
CREATE TABLE cong_thuc (
    ma_cong_thuc VARCHAR(20) PRIMARY KEY,
    ma_san_pham VARCHAR(20) NOT NULL, -- FK -> san_pham
    ten_cong_thuc VARCHAR(150) NOT NULL,
    trang_thai VARCHAR(30) NOT NULL,

    CONSTRAINT fk_cong_thuc_san_pham
        FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham)
);

-- Phiên bản công thức
CREATE TABLE phien_ban_cong_thuc (
    ma_phien_ban VARCHAR(20) PRIMARY KEY,
    ma_cong_thuc VARCHAR(20) NOT NULL, -- FK -> cong_thuc
    phien_ban VARCHAR(20) NOT NULL,
    he_so_thu_hoi NUMERIC(5,4) NOT NULL
        CHECK (he_so_thu_hoi > 0 AND he_so_thu_hoi <= 1),
    ty_le_hao_hut NUMERIC(5,4) NOT NULL
        CHECK (ty_le_hao_hut >= 0 AND ty_le_hao_hut < 1),
    hieu_luc_tu DATE NOT NULL,
    hieu_luc_den DATE,
    trang_thai VARCHAR(30) NOT NULL,

    CONSTRAINT fk_phien_ban_cong_thuc
        FOREIGN KEY (ma_cong_thuc)
        REFERENCES cong_thuc(ma_cong_thuc)
        ON DELETE CASCADE,

    CONSTRAINT uq_cong_thuc_phien_ban
        UNIQUE (ma_cong_thuc, phien_ban),

    CHECK (
        hieu_luc_den IS NULL
        OR hieu_luc_den >= hieu_luc_tu
    )
);

-- Chi tiết công thức
CREATE TABLE chi_tiet_cong_thuc (
    ma_chi_tiet_cong_thuc VARCHAR(20) PRIMARY KEY,
    ma_phien_ban VARCHAR(20) NOT NULL, -- FK -> phien_ban_cong_thuc
    ma_nguyen_lieu VARCHAR(20) NOT NULL, -- FK -> ton_kho_nguyen_lieu
    ty_le_phoi_tron NUMERIC(5,4) NOT NULL
        CHECK (ty_le_phoi_tron > 0 AND ty_le_phoi_tron <= 1),
    dinh_muc_kg_cho_1kg_thanh_pham NUMERIC(12,4) NOT NULL
        CHECK (dinh_muc_kg_cho_1kg_thanh_pham > 0),

    CONSTRAINT fk_chi_tiet_phien_ban
        FOREIGN KEY (ma_phien_ban)
        REFERENCES phien_ban_cong_thuc(ma_phien_ban)
        ON DELETE CASCADE,

    CONSTRAINT fk_chi_tiet_nguyen_lieu
        FOREIGN KEY (ma_nguyen_lieu)
        REFERENCES ton_kho_nguyen_lieu(ma_nguyen_lieu),

    CONSTRAINT uq_phien_ban_nguyen_lieu
        UNIQUE (ma_phien_ban, ma_nguyen_lieu)
);


-- Nguyên liệu - Nhà cung cấp
CREATE TABLE nguyen_lieu_nha_cung_cap (
    ma_ncc VARCHAR(20) NOT NULL,
    ma_nguyen_lieu VARCHAR(20) NOT NULL,

    don_gia_nguyen_lieu NUMERIC(15,2) NOT NULL
        CHECK (don_gia_nguyen_lieu >= 0),

    so_luong_toi_thieu_kg NUMERIC(14,2) NOT NULL
        CHECK (so_luong_toi_thieu_kg > 0),

    lead_time_ngay INTEGER NOT NULL
        CHECK (lead_time_ngay > 0),

    ty_le_chat_luong_dat NUMERIC(5,4) NOT NULL
        CHECK (ty_le_chat_luong_dat BETWEEN 0 AND 1),

    ty_le_giao_dung_han NUMERIC(5,4) NOT NULL
        CHECK (ty_le_giao_dung_han BETWEEN 0 AND 1),

    ty_le_giao_du NUMERIC(5,4) NOT NULL
        CHECK (ty_le_giao_du BETWEEN 0 AND 1),

    PRIMARY KEY (ma_ncc, ma_nguyen_lieu),

    CONSTRAINT fk_ncc_nguyen_lieu_ncc
        FOREIGN KEY (ma_ncc)
        REFERENCES nha_cung_cap(ma_ncc),

    CONSTRAINT fk_ncc_nguyen_lieu_nguyen_lieu
        FOREIGN KEY (ma_nguyen_lieu)
        REFERENCES ton_kho_nguyen_lieu(ma_nguyen_lieu)
);

-- Đơn mua nguyên liệu
CREATE TABLE don_mua_nguyen_lieu (
    ma_don_mua VARCHAR(20) PRIMARY KEY,
    ma_ncc VARCHAR(20) NOT NULL, -- FK -> nha_cung_cap
    nguoi_tao VARCHAR(50) NOT NULL, -- FK -> tai_khoan
    ngay_dat_hang DATE NOT NULL,
    ngay_du_kien_giao DATE NOT NULL,
    ngay_giao_thuc_te DATE,
    thanh_tien_vnd NUMERIC(18,2) NOT NULL DEFAULT 0
        CHECK (thanh_tien_vnd >= 0),
    trang_thai VARCHAR(30) NOT NULL,

    CONSTRAINT fk_don_mua_ncc
        FOREIGN KEY (ma_ncc)
        REFERENCES nha_cung_cap(ma_ncc),

    CONSTRAINT fk_don_mua_tai_khoan
        FOREIGN KEY (nguoi_tao)
        REFERENCES tai_khoan(ten_dang_nhap),

    CHECK (ngay_du_kien_giao >= ngay_dat_hang),
    CHECK (
        ngay_giao_thuc_te IS NULL
        OR ngay_giao_thuc_te >= ngay_dat_hang
    )
);

-- Chi tiết đơn mua
CREATE TABLE chi_tiet_don_mua (
    ma_chi_tiet_don_mua VARCHAR(20) PRIMARY KEY,
    ma_don_mua VARCHAR(20) NOT NULL, -- FK -> don_mua_nguyen_lieu
    ma_nguyen_lieu VARCHAR(20) NOT NULL, -- FK -> ton_kho_nguyen_lieu
    so_luong_nhap_kg NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (so_luong_nhap_kg >= 0),
    so_luong_dat_chat_luong_kg NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (so_luong_dat_chat_luong_kg >= 0),
    so_luong_loi_kg NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (so_luong_loi_kg >= 0),
    don_gia_vnd_kg NUMERIC(15,2) NOT NULL
        CHECK (don_gia_vnd_kg >= 0),

    CONSTRAINT fk_chi_tiet_don_mua
        FOREIGN KEY (ma_don_mua)
        REFERENCES don_mua_nguyen_lieu(ma_don_mua)
        ON DELETE CASCADE,

    CONSTRAINT fk_chi_tiet_don_mua_nguyen_lieu
        FOREIGN KEY (ma_nguyen_lieu)
        REFERENCES ton_kho_nguyen_lieu(ma_nguyen_lieu),

    CONSTRAINT uq_don_mua_nguyen_lieu
        UNIQUE (ma_don_mua, ma_nguyen_lieu),

    CHECK (
        so_luong_dat_chat_luong_kg + so_luong_loi_kg
        <= so_luong_nhap_kg
    )
);

-- Lịch sử dự báo
CREATE TABLE lich_su_du_bao (
    ma_lich_su_du_bao VARCHAR(20) PRIMARY KEY,
    ngay_gio_chay TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_bat_dau_huan_luyen DATE NOT NULL,
    ngay_ket_thuc_huan_luyen DATE NOT NULL,
    so_tuan_du_bao INTEGER NOT NULL
        CHECK (so_tuan_du_bao IN (4, 8)),
    cau_hinh_mo_hinh VARCHAR(50) NOT NULL,
    trang_thai VARCHAR(30) NOT NULL,
    ghi_chu TEXT,

    CHECK (
        ngay_ket_thuc_huan_luyen
        >= ngay_bat_dau_huan_luyen
    ),

    CHECK (
        cau_hinh_mo_hinh IN (
            'SEASONAL_NAIVE',
            'PROPHET_BASIC',
            'PROPHET_HOLIDAYS',
            'PROPHET_REGRESSORS'
        )
    )
);

-- Chi tiết lịch sử dự báo
CREATE TABLE chi_tiet_lich_su_du_bao (
    ma_chi_tiet VARCHAR(20) PRIMARY KEY,
    ma_lich_su_du_bao VARCHAR(20) NOT NULL, -- FK -> lich_su_du_bao
    ma_san_pham VARCHAR(20) NOT NULL, -- FK -> san_pham
    tuan_du_bao DATE NOT NULL,
    gia_tri_du_bao NUMERIC(14,2) NOT NULL
        CHECK (gia_tri_du_bao >= 0),
    can_duoi NUMERIC(14,2)
        CHECK (can_duoi >= 0),
    can_tren NUMERIC(14,2)
        CHECK (can_tren >= 0),
    mae NUMERIC(14,4)
        CHECK (mae >= 0),
    rmse NUMERIC(14,4)
        CHECK (rmse >= 0),
    wape NUMERIC(10,6)
        CHECK (wape >= 0),
    smape NUMERIC(10,6)
        CHECK (smape >= 0),

    CONSTRAINT fk_chi_tiet_lich_su_du_bao
        FOREIGN KEY (ma_lich_su_du_bao)
        REFERENCES lich_su_du_bao(ma_lich_su_du_bao)
        ON DELETE CASCADE,

    CONSTRAINT fk_du_bao_san_pham
        FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham),

    CONSTRAINT uq_lan_du_bao_san_pham_tuan
        UNIQUE (
            ma_lich_su_du_bao,
            ma_san_pham,
            tuan_du_bao
        ),

    CHECK (
        can_duoi IS NULL
        OR can_tren IS NULL
        OR can_duoi <= can_tren
    )
);

COMMIT;
