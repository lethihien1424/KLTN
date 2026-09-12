-- ============================================================
-- DỮ LIỆU TÀI KHOẢN KIỂM THỬ
-- Mật khẩu chung: 123456
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (
    ma_nguoi_dung,
    mat_khau,
    ho_ten,
    vai_tro,
    trang_thai
)
VALUES
(
    'admin',
    crypt('123456', gen_salt('bf', 12)),
    'Quản trị viên hệ thống',
    'ADMIN',
    'HOAT_DONG'
),
(
    'GSBH01',
    crypt('123456', gen_salt('bf', 12)),
    'Nguyễn Văn An',
    'GIAM_SAT_BAN_HANG',
    'HOAT_DONG'
),
(
    'KHSX01',
    crypt('123456', gen_salt('bf', 12)),
    'Lê Thị Dinh',
    'NHAN_VIEN_KE_HOACH_SAN_XUAT',
    'HOAT_DONG'
),
(
    'KHO01',
    crypt('123456', gen_salt('bf', 12)),
    'Lê Minh Hùng',
    'NHAN_VIEN_KHO',
    'HOAT_DONG'
),
(
    'MH01',
    crypt('123456', gen_salt('bf', 12)),
    'Nguyễn Hữu Thái',
    'NHAN_VIEN_MUA_HANG',
    'HOAT_DONG'
),
(
    'QL',
    crypt('123456', gen_salt('bf', 12)),
    'Nguyễn Minh Tâm',
    'QUAN_LY',
    'HOAT_DONG'
);