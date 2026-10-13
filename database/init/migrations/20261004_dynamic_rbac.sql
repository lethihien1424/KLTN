-- Forward-only RBAC migration. Re-running never restores revoked grants.
-- Users and business data are never updated or deleted.
BEGIN;

-- Serialize DDL and seed updates, including concurrent first executions.
SELECT pg_advisory_xact_lock(20261004, 1);

CREATE TABLE IF NOT EXISTS roles (
    ma_vai_tro VARCHAR(50) PRIMARY KEY,
    ten_vai_tro VARCHAR(100) NOT NULL,
    mo_ta TEXT,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
    thoi_gian_tao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_cap_nhat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_roles_status CHECK (trang_thai IN ('HOAT_DONG', 'NGUNG_HOAT_DONG'))
);
CREATE TABLE IF NOT EXISTS permissions (
    ma_quyen VARCHAR(80) PRIMARY KEY,
    ten_quyen VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL,
    mo_ta TEXT,
    thoi_gian_tao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS role_permissions (
    ma_vai_tro VARCHAR(50) NOT NULL REFERENCES roles(ma_vai_tro) ON DELETE CASCADE,
    ma_quyen VARCHAR(80) NOT NULL REFERENCES permissions(ma_quyen) ON DELETE CASCADE,
    PRIMARY KEY (ma_vai_tro, ma_quyen)
);
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $rbac$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '20261004_dynamic_rbac') THEN
        INSERT INTO roles (ma_vai_tro, ten_vai_tro, trang_thai) VALUES
('ADMIN', 'Quản trị viên', 'HOAT_DONG'),
('NHAN_VIEN_BAN_HANG', 'Nhân viên bán hàng', 'HOAT_DONG'),
('QUAN_LY_BAN_HANG', 'Quản lý bán hàng', 'HOAT_DONG'),
('NHAN_VIEN_MUA_HANG', 'Nhân viên mua hàng', 'HOAT_DONG'),
('QUAN_LY_MUA_HANG', 'Quản lý mua hàng', 'HOAT_DONG'),
('GIAM_SAT_BAN_HANG', 'GIAM_SAT_BAN_HANG', 'NGUNG_HOAT_DONG'),
('NHAN_VIEN_KE_HOACH_SAN_XUAT', 'NHAN_VIEN_KE_HOACH_SAN_XUAT', 'NGUNG_HOAT_DONG'),
('NHAN_VIEN_KHO', 'NHAN_VIEN_KHO', 'NGUNG_HOAT_DONG'),
('QUAN_LY', 'QUAN_LY', 'NGUNG_HOAT_DONG')
        ON CONFLICT (ma_vai_tro) DO NOTHING;

        -- Preserve every role string already used by historical users.
        INSERT INTO roles (ma_vai_tro, ten_vai_tro, trang_thai)
        SELECT DISTINCT vai_tro, vai_tro, 'NGUNG_HOAT_DONG' FROM users
        ON CONFLICT (ma_vai_tro) DO NOTHING;

        INSERT INTO permissions (ma_quyen, ten_quyen, module) VALUES
('CONG_THUC_CHANGE_STATUS', 'Đổi trạng thái công thức / BOM', 'CONG_THUC'),
('CONG_THUC_CREATE', 'Tạo công thức / BOM', 'CONG_THUC'),
('CONG_THUC_UPDATE', 'Cập nhật công thức / BOM', 'CONG_THUC'),
('CONG_THUC_VIEW', 'Xem công thức / BOM', 'CONG_THUC'),
('DASHBOARD_VIEW', 'Xem Dashboard', 'DASHBOARD'),
('DE_XUAT_NHAP_HANG_APPROVE', 'Duyệt đề xuất nhập hàng', 'DE_XUAT_NHAP_HANG'),
('DE_XUAT_NHAP_HANG_CREATE', 'Tạo đề xuất nhập hàng', 'DE_XUAT_NHAP_HANG'),
('DE_XUAT_NHAP_HANG_REJECT', 'Từ chối đề xuất nhập hàng', 'DE_XUAT_NHAP_HANG'),
('DE_XUAT_NHAP_HANG_VIEW', 'Xem đề xuất nhập hàng', 'DE_XUAT_NHAP_HANG'),
('DON_MUA_APPROVE', 'Duyệt đơn mua', 'DON_MUA'),
('DON_MUA_CREATE', 'Tạo đơn mua', 'DON_MUA'),
('DON_MUA_RECEIVE', 'Nhận hàng của đơn mua', 'DON_MUA'),
('DON_MUA_REJECT', 'Từ chối đơn mua', 'DON_MUA'),
('DON_MUA_UPDATE', 'Cập nhật đơn mua', 'DON_MUA'),
('DON_MUA_VIEW', 'Xem đơn mua', 'DON_MUA'),
('DU_BAO_RUN', 'Chạy dự báo', 'DU_BAO'),
('DU_BAO_VIEW', 'Xem dự báo', 'DU_BAO'),
('GOI_Y_NHA_CUNG_CAP_VIEW', 'Xem gợi ý nhà cung cấp', 'GOI_Y_NHA_CUNG_CAP'),
('IMPORT_CONG_THUC', 'Import công thức / BOM', 'IMPORT'),
('IMPORT_DON_HANG', 'Import đơn hàng', 'IMPORT'),
('IMPORT_NGAY_LE', 'Import ngày lễ', 'IMPORT'),
('IMPORT_NGUYEN_LIEU', 'Import nguyên liệu', 'IMPORT'),
('IMPORT_NGUYEN_LIEU_NCC', 'Import nguyên liệu theo nhà cung cấp', 'IMPORT'),
('IMPORT_NHA_CUNG_CAP', 'Import nhà cung cấp', 'IMPORT'),
('IMPORT_SAN_PHAM', 'Import sản phẩm', 'IMPORT'),
('IMPORT_TON_KHO', 'Import tồn kho', 'IMPORT'),
('NGUYEN_LIEU_CHANGE_STATUS', 'Đổi trạng thái nguyên liệu', 'NGUYEN_LIEU'),
('NGUYEN_LIEU_CREATE', 'Tạo nguyên liệu', 'NGUYEN_LIEU'),
('NGUYEN_LIEU_NCC_CREATE', 'Tạo nguyên liệu theo nhà cung cấp', 'NGUYEN_LIEU_NCC'),
('NGUYEN_LIEU_NCC_UPDATE', 'Cập nhật nguyên liệu theo nhà cung cấp', 'NGUYEN_LIEU_NCC'),
('NGUYEN_LIEU_NCC_VIEW', 'Xem nguyên liệu theo nhà cung cấp', 'NGUYEN_LIEU_NCC'),
('NGUYEN_LIEU_UPDATE', 'Cập nhật nguyên liệu', 'NGUYEN_LIEU'),
('NGUYEN_LIEU_VIEW', 'Xem nguyên liệu', 'NGUYEN_LIEU'),
('NHA_CUNG_CAP_CHANGE_STATUS', 'Đổi trạng thái nhà cung cấp', 'NHA_CUNG_CAP'),
('NHA_CUNG_CAP_CREATE', 'Tạo nhà cung cấp', 'NHA_CUNG_CAP'),
('NHA_CUNG_CAP_PERFORMANCE_VIEW', 'Xem hiệu suất nhà cung cấp', 'NHA_CUNG_CAP'),
('NHA_CUNG_CAP_SCORE', 'Tính điểm nhà cung cấp', 'NHA_CUNG_CAP'),
('NHA_CUNG_CAP_UPDATE', 'Cập nhật nhà cung cấp', 'NHA_CUNG_CAP'),
('NHA_CUNG_CAP_VIEW', 'Xem nhà cung cấp', 'NHA_CUNG_CAP'),
('NHU_CAU_NGUYEN_LIEU_VIEW', 'Xem nhu cầu nguyên liệu', 'NHU_CAU_NGUYEN_LIEU'),
('PERMISSION_VIEW', 'Xem danh sách quyền', 'PERMISSION'),
('ROLE_ASSIGN_PERMISSION', 'Gán quyền cho vai trò', 'ROLE'),
('ROLE_CREATE', 'Tạo vai trò', 'ROLE'),
('ROLE_UPDATE', 'Cập nhật vai trò', 'ROLE'),
('ROLE_VIEW', 'Xem vai trò', 'ROLE'),
('TON_KHO_CREATE', 'Tạo tồn kho', 'TON_KHO'),
('TON_KHO_HISTORY_VIEW', 'Xem lịch sử tồn kho', 'TON_KHO'),
('TON_KHO_UPDATE', 'Cập nhật tồn kho', 'TON_KHO'),
('TON_KHO_VIEW', 'Xem tồn kho', 'TON_KHO'),
('USER_ASSIGN_ROLE', 'Gán vai trò cho tài khoản', 'USER'),
('USER_CREATE', 'Tạo tài khoản', 'USER'),
('USER_DELETE', 'Xóa tài khoản', 'USER'),
('USER_IMPORT', 'Import tài khoản', 'USER'),
('USER_UPDATE', 'Cập nhật tài khoản', 'USER'),
('USER_VIEW', 'Xem tài khoản', 'USER')
        ON CONFLICT (ma_quyen) DO NOTHING;

        INSERT INTO role_permissions (ma_vai_tro, ma_quyen) VALUES
('ADMIN', 'CONG_THUC_CHANGE_STATUS'),
('ADMIN', 'CONG_THUC_CREATE'),
('ADMIN', 'CONG_THUC_UPDATE'),
('ADMIN', 'CONG_THUC_VIEW'),
('ADMIN', 'DASHBOARD_VIEW'),
('ADMIN', 'DE_XUAT_NHAP_HANG_APPROVE'),
('ADMIN', 'DE_XUAT_NHAP_HANG_CREATE'),
('ADMIN', 'DE_XUAT_NHAP_HANG_REJECT'),
('ADMIN', 'DE_XUAT_NHAP_HANG_VIEW'),
('ADMIN', 'DON_MUA_APPROVE'),
('ADMIN', 'DON_MUA_CREATE'),
('ADMIN', 'DON_MUA_RECEIVE'),
('ADMIN', 'DON_MUA_REJECT'),
('ADMIN', 'DON_MUA_UPDATE'),
('ADMIN', 'DON_MUA_VIEW'),
('ADMIN', 'DU_BAO_RUN'),
('ADMIN', 'DU_BAO_VIEW'),
('ADMIN', 'GOI_Y_NHA_CUNG_CAP_VIEW'),
('ADMIN', 'IMPORT_CONG_THUC'),
('ADMIN', 'IMPORT_DON_HANG'),
('ADMIN', 'IMPORT_NGAY_LE'),
('ADMIN', 'IMPORT_NGUYEN_LIEU'),
('ADMIN', 'IMPORT_NGUYEN_LIEU_NCC'),
('ADMIN', 'IMPORT_NHA_CUNG_CAP'),
('ADMIN', 'IMPORT_SAN_PHAM'),
('ADMIN', 'IMPORT_TON_KHO'),
('ADMIN', 'NGUYEN_LIEU_CHANGE_STATUS'),
('ADMIN', 'NGUYEN_LIEU_CREATE'),
('ADMIN', 'NGUYEN_LIEU_NCC_CREATE'),
('ADMIN', 'NGUYEN_LIEU_NCC_UPDATE'),
('ADMIN', 'NGUYEN_LIEU_NCC_VIEW'),
('ADMIN', 'NGUYEN_LIEU_UPDATE'),
('ADMIN', 'NGUYEN_LIEU_VIEW'),
('ADMIN', 'NHA_CUNG_CAP_CHANGE_STATUS'),
('ADMIN', 'NHA_CUNG_CAP_CREATE'),
('ADMIN', 'NHA_CUNG_CAP_PERFORMANCE_VIEW'),
('ADMIN', 'NHA_CUNG_CAP_SCORE'),
('ADMIN', 'NHA_CUNG_CAP_UPDATE'),
('ADMIN', 'NHA_CUNG_CAP_VIEW'),
('ADMIN', 'NHU_CAU_NGUYEN_LIEU_VIEW'),
('ADMIN', 'PERMISSION_VIEW'),
('ADMIN', 'ROLE_ASSIGN_PERMISSION'),
('ADMIN', 'ROLE_CREATE'),
('ADMIN', 'ROLE_UPDATE'),
('ADMIN', 'ROLE_VIEW'),
('ADMIN', 'TON_KHO_CREATE'),
('ADMIN', 'TON_KHO_HISTORY_VIEW'),
('ADMIN', 'TON_KHO_UPDATE'),
('ADMIN', 'TON_KHO_VIEW'),
('ADMIN', 'USER_ASSIGN_ROLE'),
('ADMIN', 'USER_CREATE'),
('ADMIN', 'USER_DELETE'),
('ADMIN', 'USER_IMPORT'),
('ADMIN', 'USER_UPDATE'),
('ADMIN', 'USER_VIEW'),
('NHAN_VIEN_MUA_HANG', 'CONG_THUC_CHANGE_STATUS'),
('NHAN_VIEN_MUA_HANG', 'CONG_THUC_CREATE'),
('NHAN_VIEN_MUA_HANG', 'CONG_THUC_UPDATE'),
('NHAN_VIEN_MUA_HANG', 'CONG_THUC_VIEW'),
('NHAN_VIEN_MUA_HANG', 'DE_XUAT_NHAP_HANG_CREATE'),
('NHAN_VIEN_MUA_HANG', 'DE_XUAT_NHAP_HANG_VIEW'),
('NHAN_VIEN_MUA_HANG', 'DON_MUA_CREATE'),
('NHAN_VIEN_MUA_HANG', 'DON_MUA_RECEIVE'),
('NHAN_VIEN_MUA_HANG', 'DON_MUA_UPDATE'),
('NHAN_VIEN_MUA_HANG', 'DON_MUA_VIEW'),
('NHAN_VIEN_MUA_HANG', 'DU_BAO_VIEW'),
('NHAN_VIEN_MUA_HANG', 'GOI_Y_NHA_CUNG_CAP_VIEW'),
('NHAN_VIEN_MUA_HANG', 'IMPORT_CONG_THUC'),
('NHAN_VIEN_MUA_HANG', 'IMPORT_NGUYEN_LIEU'),
('NHAN_VIEN_MUA_HANG', 'IMPORT_NGUYEN_LIEU_NCC'),
('NHAN_VIEN_MUA_HANG', 'IMPORT_NHA_CUNG_CAP'),
('NHAN_VIEN_MUA_HANG', 'IMPORT_TON_KHO'),
('NHAN_VIEN_MUA_HANG', 'NGUYEN_LIEU_CHANGE_STATUS'),
('NHAN_VIEN_MUA_HANG', 'NGUYEN_LIEU_CREATE'),
('NHAN_VIEN_MUA_HANG', 'NGUYEN_LIEU_NCC_CREATE'),
('NHAN_VIEN_MUA_HANG', 'NGUYEN_LIEU_NCC_UPDATE'),
('NHAN_VIEN_MUA_HANG', 'NGUYEN_LIEU_NCC_VIEW'),
('NHAN_VIEN_MUA_HANG', 'NGUYEN_LIEU_UPDATE'),
('NHAN_VIEN_MUA_HANG', 'NGUYEN_LIEU_VIEW'),
('NHAN_VIEN_MUA_HANG', 'NHA_CUNG_CAP_CHANGE_STATUS'),
('NHAN_VIEN_MUA_HANG', 'NHA_CUNG_CAP_CREATE'),
('NHAN_VIEN_MUA_HANG', 'NHA_CUNG_CAP_PERFORMANCE_VIEW'),
('NHAN_VIEN_MUA_HANG', 'NHA_CUNG_CAP_SCORE'),
('NHAN_VIEN_MUA_HANG', 'NHA_CUNG_CAP_UPDATE'),
('NHAN_VIEN_MUA_HANG', 'NHA_CUNG_CAP_VIEW'),
('NHAN_VIEN_MUA_HANG', 'NHU_CAU_NGUYEN_LIEU_VIEW'),
('NHAN_VIEN_MUA_HANG', 'TON_KHO_CREATE'),
('NHAN_VIEN_MUA_HANG', 'TON_KHO_HISTORY_VIEW'),
('NHAN_VIEN_MUA_HANG', 'TON_KHO_UPDATE'),
('NHAN_VIEN_MUA_HANG', 'TON_KHO_VIEW'),
('QUAN_LY_MUA_HANG', 'CONG_THUC_VIEW'),
('QUAN_LY_MUA_HANG', 'DASHBOARD_VIEW'),
('QUAN_LY_MUA_HANG', 'DE_XUAT_NHAP_HANG_APPROVE'),
('QUAN_LY_MUA_HANG', 'DE_XUAT_NHAP_HANG_REJECT'),
('QUAN_LY_MUA_HANG', 'DE_XUAT_NHAP_HANG_VIEW'),
('QUAN_LY_MUA_HANG', 'DON_MUA_APPROVE'),
('QUAN_LY_MUA_HANG', 'DON_MUA_REJECT'),
('QUAN_LY_MUA_HANG', 'DON_MUA_VIEW'),
('QUAN_LY_MUA_HANG', 'DU_BAO_VIEW'),
('QUAN_LY_MUA_HANG', 'GOI_Y_NHA_CUNG_CAP_VIEW'),
('QUAN_LY_MUA_HANG', 'NGUYEN_LIEU_NCC_VIEW'),
('QUAN_LY_MUA_HANG', 'NGUYEN_LIEU_VIEW'),
('QUAN_LY_MUA_HANG', 'NHA_CUNG_CAP_PERFORMANCE_VIEW'),
('QUAN_LY_MUA_HANG', 'NHA_CUNG_CAP_VIEW'),
('QUAN_LY_MUA_HANG', 'NHU_CAU_NGUYEN_LIEU_VIEW'),
('QUAN_LY_MUA_HANG', 'TON_KHO_HISTORY_VIEW'),
('QUAN_LY_MUA_HANG', 'TON_KHO_VIEW'),
('NHAN_VIEN_BAN_HANG', 'DU_BAO_RUN'),
('NHAN_VIEN_BAN_HANG', 'DU_BAO_VIEW'),
('NHAN_VIEN_BAN_HANG', 'IMPORT_DON_HANG'),
('QUAN_LY_BAN_HANG', 'DU_BAO_RUN'),
('QUAN_LY_BAN_HANG', 'DU_BAO_VIEW'),
('QUAN_LY_BAN_HANG', 'IMPORT_DON_HANG'),
('QUAN_LY_BAN_HANG', 'IMPORT_NGAY_LE'),
('QUAN_LY_BAN_HANG', 'IMPORT_SAN_PHAM')
        ON CONFLICT (ma_vai_tro, ma_quyen) DO NOTHING;

        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_vai_tro_check;
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'users'::regclass AND conname = 'fk_users_vai_tro'
        ) THEN
            ALTER TABLE users ADD CONSTRAINT fk_users_vai_tro
                FOREIGN KEY (vai_tro) REFERENCES roles(ma_vai_tro);
        END IF;

        INSERT INTO schema_migrations (version) VALUES ('20261004_dynamic_rbac');
    END IF;
END
$rbac$;

COMMIT;
