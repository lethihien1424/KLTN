-- ============================================================
-- DỮ LIỆU TÀI KHOẢN KIỂM THỬ
-- 5 tài khoản hoạt động, tương ứng 5 vai trò hiện tại
-- Mật khẩu khởi tạo chung: 123456
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (
    ma_nguoi_dung,
    mat_khau,
    ho_ten,
    vai_tro,
    trang_thai,
    nguoi_thao_tac,
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
    'admin',
    'admin@milanocoffee.com.vn',
    '0901234567',
    '123 Nguyễn Thị Minh Khai, Q.1, TP.HCM'
),
(
    'MH01',
    crypt('123456', gen_salt('bf', 12)),
    'Nguyễn Hữu Thái',
    'NHAN_VIEN_MUA_HANG',
    'HOAT_DONG',
    NULL,
    'huuthai.mh@milanocoffee.com.vn',
    '0906789012',
    '303 Hai Bà Trưng, Q.3, TP.HCM'
),
(
    'QLBH',
    crypt('123456', gen_salt('bf', 12)),
    'Nguyễn Minh Tâm',
    'QUAN_LY_BAN_HANG',
    'HOAT_DONG',
    'admin',
    'tranbichstkt@gmail.com',
    '0902345678',
    '456 Lê Duẩn, Q.1, TP.HCM'
),
(
    'NVBH',
    crypt('123456', gen_salt('bf', 12)),
    'Nguyễn Văn An',
    'NHAN_VIEN_BAN_HANG',
    'HOAT_DONG',
    'admin',
    'phucnguyenhoang700@gmail.com',
    '0903456789',
    '789 Điện Biên Phủ, Q.3, TP.HCM'
),
(
    'QLMH',
    crypt('123456', gen_salt('bf', 12)),
    'Phạm D',
    'QUAN_LY_MUA_HANG',
    'HOAT_DONG',
    'admin',
    'qlmh@gmail.com',
    '0988777333',
    ''
);