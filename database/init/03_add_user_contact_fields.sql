-- Migration: Add contact columns (email, so_dien_thoai, dia_chi) to users table safely
-- Does not affect existing foreign keys or existing user rows!

ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS so_dien_thoai VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS dia_chi VARCHAR(255);

-- Update default accounts with sample data if null
UPDATE users SET email = 'admin@milanocoffee.com.vn', so_dien_thoai = '0901234567', dia_chi = '123 Nguyễn Thị Minh Khai, Q.1, TP.HCM' WHERE ma_nguoi_dung = 'admin' AND email IS NULL;
UPDATE users SET email = 'maidinh823532@gmail.com', so_dien_thoai = '0902345678', dia_chi = '456 Lê Duẩn, Q.1, TP.HCM' WHERE ma_nguoi_dung = 'QL' AND email IS NULL;
UPDATE users SET email = 'vanan.gsbh@milanocoffee.com.vn', so_dien_thoai = '0903456789', dia_chi = '789 Điện Biên Phủ, Q.3, TP.HCM' WHERE ma_nguoi_dung = 'GSBH01' AND email IS NULL;
UPDATE users SET email = 'thidinh.khsx@milanocoffee.com.vn', so_dien_thoai = '0904567890', dia_chi = '101 Võ Văn Tần, Q.3, TP.HCM' WHERE ma_nguoi_dung = 'KHSX01' AND email IS NULL;
UPDATE users SET email = 'minhung.kho@milanocoffee.com.vn', so_dien_thoai = '0905678901', dia_chi = '202 Cách Mạng Tháng 8, Q.10, TP.HCM' WHERE ma_nguoi_dung = 'KHO01' AND email IS NULL;
UPDATE users SET email = 'huuthai.mh@milanocoffee.com.vn', so_dien_thoai = '0906789012', dia_chi = '303 Hai Bà Trưng, Q.3, TP.HCM' WHERE ma_nguoi_dung = 'MH01' AND email IS NULL;
