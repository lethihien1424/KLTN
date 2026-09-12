BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SEQUENCE IF NOT EXISTS san_pham_seq START 1;
CREATE SEQUENCE IF NOT EXISTS nguyen_lieu_seq START 1;
CREATE SEQUENCE IF NOT EXISTS tai_khoan_seq START 1;

-- =========================
-- TÀI KHOẢN
-- =========================

CREATE TABLE users(
    ma_nguoi_dung VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'TK' || LPAD(
                nextval('tai_khoan_seq')::TEXT,
                4,
                '0'
            )
        ),

    mat_khau VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    vai_tro VARCHAR(50) NOT NULL,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',

    nguoi_thao_tac VARCHAR(20),
    thoi_gian_tao TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_cap_nhat TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CHECK (
        vai_tro IN (
            'ADMIN',
            'GIAM_SAT_BAN_HANG',
            'NHAN_VIEN_KE_HOACH_SAN_XUAT',
            'NHAN_VIEN_KHO',
            'NHAN_VIEN_MUA_HANG',
            'QUAN_LY'
        )
    ),

    CHECK (
        trang_thai IN (
            'HOAT_DONG',
            'NGUNG_HOAT_DONG'
        )
    )
);
CREATE SEQUENCE IF NOT EXISTS nhat_ky_hoat_dong_seq START 1;

CREATE TABLE nhat_ky_hoat_dong (
    ma_nhat_ky VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'NKHD' || LPAD(
                nextval('nhat_ky_hoat_dong_seq')::TEXT,
                6,
                '0'
            )
        ),

    ma_nguoi_dung VARCHAR(20),

    hanh_dong VARCHAR(50) NOT NULL,

    ket_qua VARCHAR(30) NOT NULL
        DEFAULT 'THANH_CONG',

    thoi_gian TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    mo_ta TEXT,

    FOREIGN KEY (ma_nguoi_dung)
        REFERENCES users(ma_nguoi_dung)
        ON DELETE SET NULL
);
-- =========================
-- SẢN PHẨM
-- =========================

CREATE TABLE san_pham (
    ma_san_pham VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'SP' || LPAD(
                nextval('san_pham_seq')::TEXT,
                4,
                '0'
            )
        ),

    ten_san_pham VARCHAR(150) NOT NULL,

    khoi_luong NUMERIC(10,3) NOT NULL
        CHECK (khoi_luong > 0),

    don_vi_do_luong VARCHAR(20) NOT NULL DEFAULT 'kg',
    nhom_san_pham VARCHAR(100),

    trang_thai VARCHAR(30) NOT NULL
        CHECK (
            trang_thai IN (
                'DANG_KINH_DOANH',
                'NGUNG_BAN'
            )
        ),

    don_gia NUMERIC(15,2) NOT NULL DEFAULT 0
        CHECK (don_gia >= 0),

    don_vi_tien_te VARCHAR(10) NOT NULL DEFAULT 'VND',

    thoi_gian_tao TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    thoi_gian_cap_nhat TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- NGUYÊN LIỆU
-- =========================

CREATE TABLE nguyen_lieu (
    ma_nguyen_lieu VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'NL' || LPAD(
                nextval('nguyen_lieu_seq')::TEXT,
                4,
                '0'
            )
        ),

    ten_nguyen_lieu VARCHAR(100) NOT NULL UNIQUE,
    don_vi_do_luong VARCHAR(20) NOT NULL DEFAULT 'kg',

    trang_thai VARCHAR(30) NOT NULL
        DEFAULT 'DANG_SU_DUNG'
        CHECK (
            trang_thai IN (
                'DANG_SU_DUNG',
                'NGUNG_SU_DUNG'
            )
        )
);
-- =========================
-- TỒN KHO NGUYÊN LIỆU
-- =========================

CREATE TABLE ton_kho_nguyen_lieu (
    ma_nguyen_lieu VARCHAR(20) NOT NULL,
    ngay_ghi_nhan DATE NOT NULL,

    ton_kho_thuc_te NUMERIC(14,2) NOT NULL
        DEFAULT 0
        CHECK (ton_kho_thuc_te >= 0),

    so_luong_book NUMERIC(14,2) NOT NULL
        DEFAULT 0
        CHECK (so_luong_book >= 0),

    ton_kho_an_toan NUMERIC(14,2) NOT NULL
        DEFAULT 0
        CHECK (ton_kho_an_toan >= 0),

    ton_kho_toi_da NUMERIC(14,2) NOT NULL
        CHECK (
            ton_kho_toi_da
            >= ton_kho_an_toan
        ),

    ton_kho_kha_dung NUMERIC(14,2)
        GENERATED ALWAYS AS (
            ton_kho_thuc_te
            - so_luong_book
        ) STORED,

    trang_thai VARCHAR(30) NOT NULL,


    PRIMARY KEY (
        ma_nguyen_lieu,
        ngay_ghi_nhan
    ),

    FOREIGN KEY (ma_nguyen_lieu)
        REFERENCES nguyen_lieu(ma_nguyen_lieu)
);



-- =========================
-- NHÀ CUNG CẤP
-- =========================

CREATE SEQUENCE nha_cung_cap_seq START 1;

CREATE TABLE nha_cung_cap (
    ma_ncc VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'NCC' || LPAD(
                nextval('nha_cung_cap_seq')::TEXT,
                4,
                '0'
            )
        ),

    ten_ncc VARCHAR(150) NOT NULL,

    trang_thai VARCHAR(30) NOT NULL
        DEFAULT 'DANG_HOAT_DONG'
        CHECK (
            trang_thai IN (
                'DANG_HOAT_DONG',
                'NGUNG_HOAT_DONG'
            )
        ),

    diem_dieu_kien_thuong_mai NUMERIC(5,2)
        DEFAULT 0
        CHECK (
            diem_dieu_kien_thuong_mai
            BETWEEN 0 AND 100
        )
);

-- =========================
-- NGUYÊN LIỆU - NHÀ CUNG CẤP
-- =========================
CREATE SEQUENCE nguyen_lieu_ncc_seq
START 1;

CREATE TABLE nguyen_lieu_nha_cung_cap (
    ma_nguyen_lieu_ncc VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'NLNCC' || LPAD(
                nextval('nguyen_lieu_ncc_seq')::TEXT,
                4,
                '0'
            )
        ),

    ma_ncc VARCHAR(20) NOT NULL,
    ma_nguyen_lieu VARCHAR(20) NOT NULL,

    don_gia_nguyen_lieu NUMERIC(15,2) NOT NULL
        CHECK (don_gia_nguyen_lieu > 0),

    so_luong_ton_kho NUMERIC(14,2) NOT NULL
        CHECK (so_luong_ton_kho >= 0),

    so_luong_book NUMERIC(14,2) NOT NULL
        DEFAULT 0
        CHECK (
            so_luong_book >= 0
            AND so_luong_book <= so_luong_ton_kho
        ),
    so_luong_xuat   NUMERIC(14,2) NOT NULL
        DEFAULT 0
        CHECK (
            so_luong_xuat >= 0
            AND so_luong_xuat <= so_luong_ton_kho
        ),
    lead_time_ngay INTEGER NOT NULL
        CHECK (lead_time_ngay > 0),

    ty_le_chat_luong_dat NUMERIC(5,4) NOT NULL
        CHECK (ty_le_chat_luong_dat BETWEEN 0 AND 1),

    ty_le_giao_dung_han NUMERIC(5,4) NOT NULL
        CHECK (ty_le_giao_dung_han BETWEEN 0 AND 1),

    ty_le_giao_du NUMERIC(5,4) NOT NULL
        CHECK (ty_le_giao_du BETWEEN 0 AND 1),

    FOREIGN KEY (ma_ncc)
        REFERENCES nha_cung_cap(ma_ncc),

    FOREIGN KEY (ma_nguyen_lieu)
        REFERENCES nguyen_lieu(ma_nguyen_lieu)
);


-- =========================
-- NGÀY LỄ
-- =========================
CREATE SEQUENCE ngay_le_seq START 1;

CREATE TABLE ngay_le (
    ma_ngay_le VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'NGLE' || LPAD(
                nextval('ngay_le_seq')::TEXT,
                4,
                '0'
            )
        ),

    ten_ngay_le VARCHAR(150) NOT NULL,

    ngay_bat_dau DATE NOT NULL,
    ngay_ket_thuc DATE NOT NULL,

    loai_ngay_le VARCHAR(50) NOT NULL,

    CHECK (
        ngay_ket_thuc >= ngay_bat_dau
    )
);

-- =========================
-- CÔNG THỨC
-- Không tạo bảng phien_ban_cong_thuc
-- =========================
-- =========================
-- SEQUENCE CÔNG THỨC
-- =========================

CREATE SEQUENCE cong_thuc_seq
START 1;

CREATE SEQUENCE chi_tiet_cong_thuc_seq
START 1;


-- =========================
-- CÔNG THỨC
-- =========================

CREATE TABLE cong_thuc (
    ma_cong_thuc VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'CT' || LPAD(
                nextval('cong_thuc_seq')::TEXT,
                4,
                '0'
            )
        ),

    ten_cong_thuc VARCHAR(150) NOT NULL,

    ma_san_pham VARCHAR(20) NOT NULL,

    he_so_thu_hoi NUMERIC(5,4) NOT NULL
        CHECK (
            he_so_thu_hoi > 0
            AND he_so_thu_hoi <= 1
        ),

    ty_le_hao_hut NUMERIC(5,4) NOT NULL
        CHECK (
            ty_le_hao_hut >= 0
            AND ty_le_hao_hut < 1
        ),

    thoi_gian_tao TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    thoi_gian_cap_nhat TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    trang_thai VARCHAR(30) NOT NULL
        DEFAULT 'DANG_SU_DUNG'
        CHECK (
            trang_thai IN (
                'DANG_SU_DUNG',
                'NGUNG_SU_DUNG'
            )
        ),

    FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham)
);
-- =========================
-- CHI TIẾT CÔNG THỨC
-- =========================

CREATE TABLE chi_tiet_cong_thuc (
    ma_chi_tiet_cong_thuc VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'CTCT' || LPAD(
                nextval('chi_tiet_cong_thuc_seq')::TEXT,
                4,
                '0'
            )
        ),

    ma_cong_thuc VARCHAR(20) NOT NULL,
    ma_nguyen_lieu VARCHAR(20) NOT NULL,

    ty_le_phoi_tron NUMERIC(5,4) NOT NULL
        CHECK (
            ty_le_phoi_tron > 0
            AND ty_le_phoi_tron <= 1
        ),

    FOREIGN KEY (ma_cong_thuc)
        REFERENCES cong_thuc(ma_cong_thuc)
        ON DELETE CASCADE,

    FOREIGN KEY (ma_nguyen_lieu)
        REFERENCES nguyen_lieu(ma_nguyen_lieu),

    UNIQUE (
        ma_cong_thuc,
        ma_nguyen_lieu
    )
);
-- =====================================================
-- SEQUENCE
-- =====================================================

CREATE SEQUENCE lich_su_tieu_thu_seq START 1;
CREATE SEQUENCE ke_hoach_san_xuat_seq START 1;


CREATE SEQUENCE lich_su_du_bao_seq START 1;
CREATE SEQUENCE chi_tiet_lich_su_du_bao_seq START 1;



-- =====================================================
-- LỊCH SỬ TIÊU THỤ
-- =====================================================

CREATE TABLE lich_su_tieu_thu (
    ma_lich_su VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'LSTT' || LPAD(
                nextval('lich_su_tieu_thu_seq')::TEXT,
                4,
                '0'
            )
        ),

    ma_don_hang VARCHAR(50) NOT NULL,
    ma_san_pham VARCHAR(20) NOT NULL,

    ngay_ban DATE NOT NULL,

    so_luong_ban INTEGER NOT NULL
        CHECK (so_luong_ban > 0),

    gia_goc NUMERIC(15,2)
        CHECK (gia_goc >= 0),

    muc_giam_gia NUMERIC(5,4) NOT NULL
        DEFAULT 0
        CHECK (
            muc_giam_gia BETWEEN 0 AND 1
        ),

    gia_ban_sau_giam NUMERIC(15,2)
        CHECK (
            gia_ban_sau_giam >= 0
        ),

    co_khuyen_mai BOOLEAN NOT NULL
        DEFAULT FALSE,

    chuong_trinh_km VARCHAR(150),

    kenh_ban_hang VARCHAR(50),

    ma_ngay_le VARCHAR(20),

    trang_thai_san_xuat VARCHAR(30) NOT NULL
        DEFAULT 'DA_SAN_XUAT'
        CHECK (
            trang_thai_san_xuat = 'DA_SAN_XUAT'
        ),

    FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham),

    FOREIGN KEY (ma_ngay_le)
        REFERENCES ngay_le(ma_ngay_le)
        ON DELETE SET NULL,

    UNIQUE (
        ma_don_hang,
        ma_san_pham
    )
);


-- =====================================================
-- KẾ HOẠCH SẢN XUẤT
-- =====================================================

CREATE TABLE ke_hoach_san_xuat (
    ma_ke_hoach VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'KHSX' || LPAD(
                nextval('ke_hoach_san_xuat_seq')::TEXT,
                4,
                '0'
            )
        ),

    ma_don_hang VARCHAR(50) NOT NULL,

    ngay_don_hang DATE NOT NULL,

    ma_san_pham VARCHAR(20) NOT NULL,

    so_luong INTEGER NOT NULL
        CHECK (
            so_luong > 0
        ),

    trang_thai_san_xuat VARCHAR(30) NOT NULL
        DEFAULT 'CHO_SAN_XUAT'
        CHECK (
            trang_thai_san_xuat IN (
                'CHO_SAN_XUAT'
            )
        ),

    FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham),

    UNIQUE (
        ma_don_hang,
        ma_san_pham
    )
);


-- =====================================================
-- LỊCH SỬ DỰ BÁO
-- =====================================================

CREATE TABLE lich_su_du_bao (
    ma_lich_su_du_bao VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'LSDB' || LPAD(
                nextval('lich_su_du_bao_seq')::TEXT,
                4,
                '0'
            )
        ),

    ngay_bat_dau_huan_luyen DATE NOT NULL,

    ngay_ket_thuc_huan_luyen DATE NOT NULL,

    so_tuan_du_bao INTEGER NOT NULL
        CHECK (
            so_tuan_du_bao IN (4, 8)
        ),

    cau_hinh_mo_hinh VARCHAR(50) NOT NULL,

    thoi_gian_chay TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    tham_so JSONB,

    trang_thai VARCHAR(30) NOT NULL,

    nguoi_thuc_hien VARCHAR(20),

    thoi_gian_tao TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    CHECK (
        ngay_ket_thuc_huan_luyen
        >= ngay_bat_dau_huan_luyen
    )
);


-- =====================================================
-- CHI TIẾT LỊCH SỬ DỰ BÁO
-- =====================================================

CREATE TABLE chi_tiet_lich_su_du_bao (
    ma_chi_tiet VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'CTDB' || LPAD(
                nextval('chi_tiet_lich_su_du_bao_seq')::TEXT,
                4,
                '0'
            )
        ),

    ma_lich_su_du_bao VARCHAR(20) NOT NULL,

    ma_san_pham VARCHAR(20) NOT NULL,

    ma_nguyen_lieu VARCHAR(20),

    so_luong_du_bao_kg NUMERIC(14,2) NOT NULL
        CHECK (
            so_luong_du_bao_kg >= 0
        ),

    mae NUMERIC(14,4)
        CHECK (
            mae >= 0
        ),

    rmse NUMERIC(14,4)
        CHECK (
            rmse >= 0
        ),

    wape NUMERIC(10,6)
        CHECK (
            wape >= 0
        ),

    smape NUMERIC(10,6)
        CHECK (
            smape >= 0
        ),

    FOREIGN KEY (ma_lich_su_du_bao)
        REFERENCES lich_su_du_bao(ma_lich_su_du_bao)
        ON DELETE CASCADE,

    FOREIGN KEY (ma_san_pham)
        REFERENCES san_pham(ma_san_pham),

    FOREIGN KEY (ma_nguyen_lieu)
        REFERENCES nguyen_lieu(ma_nguyen_lieu)
        ON DELETE SET NULL
);


CREATE SEQUENCE de_xuat_nhap_hang_seq START 1;
CREATE SEQUENCE chi_tiet_de_xuat_nhap_hang_seq START 1;

-- =====================================================
-- ĐỀ XUẤT NHẬP HÀNG
-- =====================================================

CREATE TABLE de_xuat_nhap_hang (
    ma_de_xuat VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'DX' || LPAD(
                nextval('de_xuat_nhap_hang_seq')::TEXT,
                4,
                '0'
            )
        ),

    ngay_de_xuat_nhap_hang DATE NOT NULL
        DEFAULT CURRENT_DATE,
    ngay_tao_de_xuat TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    ghi_chu TEXT
);


-- =====================================================
-- CHI TIẾT ĐỀ XUẤT NHẬP HÀNG
-- =====================================================

CREATE TABLE chi_tiet_de_xuat_nhap_hang (
    ma_chi_tiet VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'CTDX' || LPAD(
                nextval('chi_tiet_de_xuat_nhap_hang_seq')::TEXT,
                4,
                '0'
            )
        ),

    ma_de_xuat VARCHAR(20) NOT NULL,

    ma_nguyen_lieu VARCHAR(20) NOT NULL,

    ma_ncc VARCHAR(20),

    so_luong_de_xuat_kg NUMERIC(14,2) NOT NULL
        CHECK (
            so_luong_de_xuat_kg > 0
        ),

    don_gia_du_kien NUMERIC(15,2)
        CHECK (
            don_gia_du_kien >= 0
        ),

    FOREIGN KEY (ma_de_xuat)
        REFERENCES de_xuat_nhap_hang(ma_de_xuat)
        ON DELETE CASCADE,

    FOREIGN KEY (ma_nguyen_lieu)
        REFERENCES nguyen_lieu(ma_nguyen_lieu),

    FOREIGN KEY (ma_ncc)
        REFERENCES nha_cung_cap(ma_ncc),

    UNIQUE (
        ma_de_xuat,
        ma_nguyen_lieu,
        ma_ncc
    )
);

-- =====================================================
-- ĐƠN MUA NGUYÊN LIỆU
-- =====================================================

CREATE SEQUENCE don_mua_nguyen_lieu_seq START 1;
CREATE SEQUENCE chi_tiet_don_mua_seq START 1;

CREATE TABLE don_mua_nguyen_lieu (
    ma_don_mua VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'DM' || LPAD(
                nextval('don_mua_nguyen_lieu_seq')::TEXT,
                4,
                '0'
            )
        ),

    ma_ncc VARCHAR(20) NOT NULL,
    ma_de_xuat VARCHAR(20),
    nguoi_tao VARCHAR(20) NOT NULL,

    ngay_dat_hang DATE NOT NULL,

    ngay_du_kien_giao DATE NOT NULL,

    ngay_giao_thuc_te DATE,

    tong_tien NUMERIC(18,2) NOT NULL
        DEFAULT 0
        CHECK (
            tong_tien >= 0
        ),

    trang_thai VARCHAR(30) NOT NULL
    DEFAULT 'CHUA_DUYET'
    CHECK (
        trang_thai IN (
            'CHUA_DUYET',
            'DA_DUYET',
            'TU_CHOI',
            'DA_NHAN_HANG'
        )
    ),

    FOREIGN KEY (ma_ncc)
        REFERENCES nha_cung_cap(ma_ncc),
    FOREIGN KEY (ma_de_xuat)
    REFERENCES de_xuat_nhap_hang(ma_de_xuat),
    FOREIGN KEY (nguoi_tao)
        REFERENCES users(ma_nguoi_dung),

    CHECK (
        ngay_du_kien_giao >= ngay_dat_hang
    ),

    CHECK (
        ngay_giao_thuc_te IS NULL
        OR ngay_giao_thuc_te >= ngay_dat_hang
    )
);

-- =====================================================
-- CHI TIẾT ĐƠN MUA NGUYÊN LIỆU
-- =====================================================

CREATE TABLE chi_tiet_don_mua (
    ma_chi_tiet_don_mua VARCHAR(20) PRIMARY KEY
        DEFAULT (
            'CTDM' || LPAD(
                nextval('chi_tiet_don_mua_seq')::TEXT,
                4,
                '0'
            )
        ),

    ma_don_mua VARCHAR(20) NOT NULL,
    ma_nguyen_lieu VARCHAR(20) NOT NULL,
    so_luong_mua NUMERIC(14,2) NOT NULL
        CHECK (so_luong_mua > 0),
    
    don_gia_vnd_kg NUMERIC(15,2) NOT NULL
        CHECK (don_gia_vnd_kg >= 0),
    so_luong_thuc_nhan NUMERIC(14,2) NOT NULL
        DEFAULT 0
        CHECK (so_luong_thuc_nhan >= 0),

    ly_do_khong_nhan TEXT,


    FOREIGN KEY (ma_don_mua)
        REFERENCES don_mua_nguyen_lieu(ma_don_mua)
        ON DELETE CASCADE,

    FOREIGN KEY (ma_nguyen_lieu)
        REFERENCES nguyen_lieu(ma_nguyen_lieu),

    UNIQUE (
        ma_don_mua,
        ma_nguyen_lieu
    ),

    CHECK (
        so_luong_thuc_nhan <= so_luong_mua
    )
);

COMMIT;