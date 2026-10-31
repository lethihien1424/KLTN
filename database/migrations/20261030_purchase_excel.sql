-- Additive only. No changes to existing orders, receipts, stock or permissions.
CREATE TABLE IF NOT EXISTS purchase_excel_import (
    ma_tham_chieu VARCHAR(80) PRIMARY KEY,
    ma_don_mua VARCHAR(20) NOT NULL UNIQUE REFERENCES don_mua_nguyen_lieu(ma_don_mua),
    ghi_chu TEXT NOT NULL DEFAULT ''
);
