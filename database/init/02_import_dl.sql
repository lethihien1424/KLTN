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
    trang_thai,
    email,
    so_dien_thoai,
    dia_chi
)
VALUES
(
    'admin',
    crypt('123456', gen_salt('bf', 12)),
    'Quản trị viên hệ thống',
    'ADMIN',
    'HOAT_DONG',
    'admin@milanocoffee.com.vn',
    '0901234567',
    '123 Nguyễn Thị Minh Khai, Q.1, TP.HCM'
),
(
    'GSBH01',
    crypt('123456', gen_salt('bf', 12)),
    'Nguyễn Văn An',
    'GIAM_SAT_BAN_HANG',
    'HOAT_DONG',
    'vanan.gsbh@milanocoffee.com.vn',
    '0903456789',
    '789 Điện Biên Phủ, Q.3, TP.HCM'
),
(
    'KHSX01',
    crypt('123456', gen_salt('bf', 12)),
    'Lê Thị Dinh',
    'NHAN_VIEN_KE_HOACH_SAN_XUAT',
    'HOAT_DONG',
    'thidinh.khsx@milanocoffee.com.vn',
    '0904567890',
    '101 Võ Văn Tần, Q.3, TP.HCM'
),
(
    'KHO01',
    crypt('123456', gen_salt('bf', 12)),
    'Lê Minh Hùng',
    'NHAN_VIEN_KHO',
    'HOAT_DONG',
    'minhung.kho@milanocoffee.com.vn',
    '0905678901',
    '202 Cách Mạng Tháng 8, Q.10, TP.HCM'
),
(
    'MH01',
    crypt('123456', gen_salt('bf', 12)),
    'Nguyễn Hữu Thái',
    'NHAN_VIEN_MUA_HANG',
    'HOAT_DONG',
    'huuthai.mh@milanocoffee.com.vn',
    '0906789012',
    '303 Hai Bà Trưng, Q.3, TP.HCM'
),
(
    'QL',
    crypt('123456', gen_salt('bf', 12)),
    'Nguyễn Minh Tâm',
    'QUAN_LY',
    'HOAT_DONG',
    'minhtam.ql@milanocoffee.com.vn',
    '0902345678',
    '456 Lê Duẩn, Q.1, TP.HCM'
);