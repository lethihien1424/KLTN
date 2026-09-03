-- ============================================================
-- DỮ LIỆU TÀI KHOẢN KIỂM THỬ
-- Mật khẩu chung: 123456
-- Mã tài khoản được PostgreSQL tự động tạo
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO tai_khoan (
    mat_khau,
    ho_ten,
    vai_tro,
    trang_thai
)
VALUES
(
    crypt('123456', gen_salt('bf', 12)),
    'Quản trị viên hệ thống',
    'ADMIN',
    'HOAT_DONG'
),
(
    crypt('123456', gen_salt('bf', 12)),
    'Nguyễn Văn An',
    'GIAM_SAT_BAN_HANG',
    'HOAT_DONG'
),
(
    crypt('123456', gen_salt('bf', 12)),
    'Lê Thị Dinh',
    'NHAN_VIEN_KE_HOACH_SAN_XUAT',
    'HOAT_DONG'
),
(
    crypt('123456', gen_salt('bf', 12)),
    'Lê Minh Hùng',
    'NHAN_VIEN_KHO',
    'HOAT_DONG'
),
(
    crypt('123456', gen_salt('bf', 12)),
    'Nguyễn Hữu Thái',
    'NHAN_VIEN_MUA_HANG',
    'HOAT_DONG'
),
(
    crypt('123456', gen_salt('bf', 12)),
    'Nguyễn Minh Tâm',
    'QUAN_LY',
    'HOAT_DONG'
);