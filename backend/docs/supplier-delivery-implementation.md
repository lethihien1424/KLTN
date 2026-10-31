# Lịch sử nhận nguyên liệu và hiệu suất NCC – kết quả 29/10/2026

## Luồng nhận hàng được tái sử dụng

Giữ endpoint nhận hàng của đơn mua và transaction hiện có. Đơn phải đã duyệt và chưa chốt; mọi dòng đơn có số giao/đạt/không đạt/chấp nhận (dòng không giao đợt này ghi 0). Chỉ lượng chấp nhận được cộng kho, `so_luong_thuc_nhan` là lũy kế lượng chấp nhận; lượng book Milano và tồn/book/xuất NCC không thay đổi. Lưu số tồn trước/sau và liên kết từng dòng phiếu nhận tới giao dịch kho thực tế. Nguyên liệu đơn vị gram được quy đổi từ kg mua theo cơ chế tồn kho hiện có.

API cũ mặc định chốt một lần. Người dùng bỏ chọn hoàn tất để nhận nhiều đợt; đơn mở giữ trạng thái DA_DUYET. `request_id` là bắt buộc cho nhiều đợt: cùng mã/cùng nội dung trả kết quả cũ, khác nội dung trả 409. Khóa NCC, đơn và nguyên liệu/kho theo thứ tự. Hỏng bất kỳ bước nhận/tính điểm nào sẽ rollback đơn, phiếu nhận, tồn và lịch sử. Không nhận lại phần thiếu của đơn đã chốt.

Hai bảng mới `phieu_nhan_nguyen_lieu`, `chi_tiet_phieu_nhan_nguyen_lieu` lưu nguồn, ngày đặt/dự kiến/thực nhận, lượng đặt/giao/đạt/không đạt/chấp nhận, lý do, ghi chú, người xác nhận và tham chiếu. Không dựng phiếu nhận giả từ snapshot cũ.

## Công thức và nguồn KPI

Chỉ đọc phiếu nhận đã lưu thành công. Gộp theo đơn thật hoặc cặp NCC/mã đơn lịch sử; một đơn nhiều phiếu vẫn chỉ là một mẫu đơn.

- **Đúng hạn**: số đơn đã chốt có giao thực tế > 0 và ngày nhận cuối không vượt ngày dự kiến / số đơn đã chốt. Đơn chốt không giao được tính trượt đúng hạn.
- **Giao đủ**: từng nguyên liệu `min(tổng chấp nhận / số đặt, 1)`; trung bình các nguyên liệu trong đơn, rồi trung bình các đơn. Đơn mở cũng tham gia theo phần đã nhận, không coi phần chờ là đã giao. Hàng thay thế cho hàng bị loại không đẩy tỷ lệ vượt 100%.
- **Chất lượng**: tổng đạt / tổng giao trong từng nhóm cùng đơn vị; trung bình các nhóm đơn vị có mẫu. Không cộng kg với bao/túi. Phiếu của client cũ không có kiểm chất lượng được loại khỏi mẫu chất lượng.
- **Lead time thực tế**: trung bình ngày lịch từ ngày đặt đến ngày nhận cuối của đơn đã chốt có giao thực tế. Đơn không giao không có lead time.
- Đơn cũ đã nhận nhưng không có phiếu vẫn là nguồn DON_CU cho các dữ kiện có thể kiểm chứng; chất lượng để chưa biết, không tạo lịch sử bù.

Giữ trọng số điểm thương mại 30% chất lượng, 25% đúng hạn, 20% đủ, 15% lead time, 10% khả dụng NCC. Ưu tiên dữ liệu thực tế khi có mẫu, fallback cấu hình khi chưa có mẫu và ghi rõ nguồn. Lead time thực tế không vượt mục tiêu cấu hình đạt 100; vượt thì điểm bằng `100 × mục tiêu / thực tế`. Nhận hàng và import lịch sử tự tính lại điểm trong cùng transaction. Không sửa Prophet/BOM.

## API/UI/RBAC

- Tái sử dụng API nhận hàng của đơn mua; bổ sung các trường chất lượng, hoàn tất, request_id và ghi chú.
- GET `/api/don-mua-nguyen-lieu/{ma}/lich-su-nhan-hang`: quyền đơn mua/XEM.
- GET `/api/nha-cung-cap/{ma}/hieu-suat-chi-tiet`: quyền hiệu suất NCC/XEM; trả KPI, nguồn và các đơn/phiếu cấu thành.
- GET `/api/giao-nguyen-lieu/lich-su/excel/template`: quyền đơn mua/NHAP_FILE.
- POST cùng tiền tố `/preview`, `/import`: quyền đơn mua/NHAP_FILE và NCC/TINH_DIEM.
- Chi tiết đơn có tab lịch sử, lượng lũy kế/còn chờ; popup nhận giữ phong cách cũ và thêm kiểm chất lượng/nhận nhiều đợt.
- Trang hiệu suất có chỉ số thực tế, drawer truy vết và import lịch sử riêng. Các quyền được kiểm tra động phía backend và UI; không hard-code vai trò hoặc sửa dữ liệu phân quyền.

Import lịch sử dùng nguồn LICH_SU, không liên kết đơn mua thật/giao dịch kho và không sửa tồn Milano. Bắt trùng NCC/đơn cũ/lần giao, kiểm tra đủ các nguyên liệu giữa các đợt, metadata/ngày nhất quán, lượng chấp nhận lũy kế và không thêm sau khi chốt. Không nhận mã lịch sử trùng mã đơn thật. Preview/confirm riêng, toàn file một transaction.

## File của đợt nhận hàng

Tạo: models/delivery_receipt_model.py; services/delivery_service.py, delivery_kpi_service.py, delivery_excel_service.py, delivery_schema_service.py; routes/delivery_routes.py; reason_tests/test_delivery.py; scripts/export_delivery_migration.py, apply_delivery_migration.py; migration 20261029_delivery_history.sql; frontend services/deliveryService.ts, pages/don-mua/DeliveryHistoryTable.tsx, pages/nha-cung-cap/SupplierDeliveryDetail.tsx, useDeliveryExcel.tsx, tests/delivery.spec.ts.

Sửa tích hợp: models/__init__.py; schemas/don_mua_schema.py, dashboard_schema.py; services/don_mua_service.py, stock_accounting_service.py, nha_cung_cap_service.py, dashboard_service.py; repositories/dashboard_repository.py; routes/api_router.py; main.py; frontend NhanHangDialog.tsx, ChiTietDonMuaPage.tsx, HieuSuatNhaCungCapPage.tsx, StockDetailDrawer.tsx, donMuaService.ts, purchaseTypes.ts, tests/purchase.spec.ts. Các file này có thể còn chứa thay đổi tồn kho trước đó.

## Migration/kiểm thử/giới hạn

Migration additive `20261029_delivery_history` đã áp dụng trên đúng DB Docker sau xác minh cluster với backend, backup pg_dump -Fc, kiểm tra archive và fingerprints các bảng cũ. Báo cáo: `reports/delivery-history/20261029_021721/verification.json`, `business_unchanged=true`; hai bảng phiếu nhận mới ban đầu đều 0 dòng. Backup `milano_before.dump` cùng thư mục. Migration chạy lại an toàn; không reset/xóa dữ liệu.

- PostgreSQL 15/15 PASS; inventory 27 + error handler 1 PASS; BOM 28 và nhu cầu nguyên liệu 7 PASS.
- Frontend delivery 3 + inventory 11 PASS; ba luồng mua hàng được chọn regression PASS; frontend build PASS. Các test dùng fixture/schema rollback hoặc mock, không nhập hàng giả trên dữ liệu Milano.
- Công thức hiện coi nhận cuối là mốc hoàn thành giao; đơn chốt thiếu vẫn có thể đúng hạn nhưng điểm đủ thấp. Chất lượng là trung bình nhóm đơn vị, không phải quy đổi mọi nguyên liệu về kg.
- Không tự đồng bộ tồn NCC vì chưa có nguồn tin cậy. Không tự tạo lịch sử cho đơn cũ thiếu chứng từ. Khả năng truy vết phụ thuộc dữ liệu được xác nhận từ lúc dùng phiếu nhận hoặc import lịch sử riêng.
