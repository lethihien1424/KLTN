# Mã nghiệp vụ phiếu nhận PN

## Phạm vi

Giữ `phieu_nhan_nguyen_lieu.ma_phieu_nhan` làm primary key UUID 32 ký tự. Bổ sung `ma_phieu_nhap VARCHAR(32) NOT NULL`, unique constraint `uq_phieu_nhan_ma_phieu_nhap` và check định dạng `PN` + ít nhất bốn chữ số. Không thay khóa ngoại của chi tiết phiếu, giao dịch kho, đơn mua hoặc dữ liệu giá.

Đã hoàn thành mã nguồn và kiểm thử. Chưa áp dụng migration vào database public, chưa triển khai/restart ứng dụng đang chạy. Không commit/push Git.

## Cách cấp mã

Một sequence PostgreSQL BIGINT duy nhất `phieu_nhap_number_seq`, không cycle, dùng chung cho phiếu nhận thực tế và phiếu lịch sử. Giá trị mặc định tại database cấp `PN0001`…`PN9999`, sau đó `PN10000`… Không dùng `MAX + 1`, không sinh mã trên frontend.

SQL default gọi `nextval` đúng một lần, rồi dùng `currval` của chính session để định dạng; session khác không thể thay `currval` này. UNIQUE bảo vệ tính duy nhất ở database. Khi một transaction lỗi, phiếu và chi tiết rollback nhưng sequence đã cấp vẫn tăng: có thể có khoảng trống, mã không bị tái sử dụng.

Model đăng ký sequence với SQLAlchemy metadata để cài đặt mới bằng `Base.metadata.create_all` cũng có cơ chế cấp mã. Hai luồng nhận hàng/import lịch sử tiếp tục tạo UUID như trước và nhận PN từ server default khi flush, không có bộ đếm riêng theo nguồn.

## Migration

File: `database/migrations/20261031_receipt_business_numbers.sql`.

1. Chạy trong một transaction, lấy advisory lock và khóa bảng phiếu để backfill không xen kẽ với INSERT.
2. Thêm sequence/cột nếu chưa có; giữ mức sequence cao hơn giữa số đã tiêu thụ và mã PN đã lưu.
3. Chỉ cấp mã cho phiếu có `ma_phieu_nhap IS NULL`, theo `ngay_giao_thuc_te`, `thoi_gian`, `ma_phieu_nhan` tăng dần. UUID là khóa phân xử ổn định khi cùng ngày/thời điểm.
4. Đặt server default, NOT NULL, UNIQUE và check định dạng.

Chạy lại không cấp lại mã cho phiếu đã có PN, không hạ sequence kể cả đã có số bị tiêu thụ trong transaction rollback. Không INSERT thêm phiếu/giao dịch kho và không UPDATE bất kỳ cột nghiệp vụ nào khác. Khi lỗi, DDL và backfill rollback toàn bộ; sequence có thể để lại khoảng trống theo cơ chế PostgreSQL.

Logic SQL giống hệt trong `src/core/receipt_numbering.py`. Backend gọi `upgrade_receipt_numbers` tại startup sau bước chuẩn bị schema lịch sử hiện có. Khi triển khai có thể chạy migration trước rồi triển khai code mới; startup chạy lại an toàn. Phiên làm việc này chỉ thử migration trên schema kiểm thử, không chạy startup trên public.

## API, UI và Excel

- Response lịch sử, chi tiết, lịch sử theo đơn mua và hiệu suất NCC trả cả `ma_phieu_nhan` (UUID nội bộ) và `ma_phieu_nhap` (PN).
- `GET /api/giao-nguyen-lieu/lich-su/phieu/{code}` tiếp tục nhận UUID, đồng thời hỗ trợ PN.
- Tìm kiếm `search` hỗ trợ PN và UUID; bộ lọc `ma_phieu_nhap` lọc chính xác mã PN. Bộ lọc này cũng áp dụng cho export và tải template cập nhật giá.
- Bảng lịch sử, popup, bảng nhận theo đơn/NCC và preview cập nhật giá hiển thị PN; thao tác mở chi tiết và row keys tiếp tục dùng UUID. UI cũ/fixture chưa có trường PN vẫn có thể dùng ID từ response, không tự cấp số.
- Export lịch sử: cột **Mã phiếu nhận** là PN; thêm cột **ID phiếu nhận (UUID)** ở cuối, giữ vị trí các cột dữ liệu cũ.
- Template cập nhật giá giữ schema 5 cột và tên `ma_phieu_nhan` để tương thích file cũ, nhưng dữ liệu cột này dùng PN. Backend nhận PN hoặc UUID cho cả schema 5 cột và schema chi tiết 12 cột. Sau phân giải, xử lý/audit vẫn dùng UUID + mã nguyên liệu.
- Một file dùng cả PN và UUID cho cùng một phiếu/nguyên liệu bị báo trùng, không ghi hai lần. Mã không tồn tại không được cập nhật. Cơ chế preview token, transaction, kiểm tra giá snapshot và RBAC động giữ nguyên.
- Import lịch sử giữ template/quy tắc xác định đơn cũ/đợt cũ như trước, database tự cấp PN sau xác nhận. Preview không tiêu thụ số PN. Ghi chú giao dịch kho mới dùng mã PN; không viết lại ghi chú của giao dịch cũ.

## Các file thay đổi trong enhancement này

Thêm:

- `backend/src/core/receipt_numbering.py`
- `database/migrations/20261031_receipt_business_numbers.sql`
- `backend/tests/test_receipt_numbers.py`
- `backend/scripts/test_receipt_numbers_isolated.py`
- `backend/docs/receipt-business-numbers.md`
- `reports/receipt-numbers/verification.md` và báo cáo test/hash.

Bổ sung vào các file đang có trong workspace:

- `backend/src/models/delivery_receipt_model.py`: trường PN, sequence và constraints.
- `backend/src/main.py`: gọi migration bổ sung khi startup.
- `backend/src/routes/delivery_routes.py`: nhận bộ lọc PN.
- `backend/src/services/delivery_history_service.py`: search/filter/detail/export PN, giữ UUID.
- `backend/src/services/delivery_service.py`: ghi chú phiếu mới dùng PN; response history tự chứa trường mới.
- `backend/src/services/delivery_price_update_service.py`: template PN, phân giải PN/UUID về cùng bản ghi nội bộ.
- `frontend/src/services/deliveryService.ts`: kiểu dữ liệu, formatter mã hiển thị và bộ lọc.
- `frontend/src/pages/don-mua/LichSuNhapNguyenLieuPage.tsx`: bảng, popup, tìm kiếm và bộ lọc PN.
- `frontend/src/pages/don-mua/DeliveryHistoryTable.tsx`: bảng liên kết đơn mua/NCC.
- `frontend/src/pages/don-mua/useReceiptPriceExcel.tsx`: mã hiển thị trong preview giá.
- `frontend/tests/delivery-history.spec.ts`: test PN; fixture tổng hợp khi file mẫu gốc không có.

Không sửa sidebar/layout, thuật toán dự báo/BOM, KPI hoặc quy trình duyệt/nhận hàng.

## Kiểm thử và bảo toàn dữ liệu

- `npm run build`: đạt (còn các cảnh báo dependency/chunk bundling có sẵn).
- `python scripts/test_receipt_numbers_isolated.py`: **25 đạt**, gồm 11 test PN/migration/concurrency và 14 test hồi quy đơn mua/Excel/nhận hàng.
- Concurrency: 40 transaction từ 8 worker, mã không trùng; có transaction rollback và kiểm tra mã tiếp theo lớn hơn toàn bộ số đã cấp.
- Kiểm tra PN10000/PN10001; UUID vẫn 32 ký tự; UNIQUE từ chối trùng.
- Migration dữ liệu cũ, nhiều đợt nhận và phiếu lịch sử: đối chiếu mọi giá trị ngoài cột PN, bao gồm UUID, foreign key, đơn/NCC/ngày/số lượng/giá, tồn kho và giao dịch; chạy lại không thay mã. Kiểm tra lỗi migration rollback cột/backfill.
- Import lịch sử và nhận hàng thực tế dùng chung sequence; retry request nhận hàng không tạo thêm phiếu/mã; import lịch sử không cộng kho.
- Cập nhật giá bằng PN và UUID tác động cùng dòng nội bộ, không thêm phiếu; KPI/tồn kho giữ nguyên. File trộn hai mã của cùng dòng bị chặn trùng; RBAC vẫn chặn truy cập thiếu quyền.
- API và export kiểm tra cả PN và UUID; bộ lọc PN xuất đúng phiếu.
- `npx playwright test tests/delivery-history.spec.ts tests/delivery.spec.ts`: lần đầu 15 đạt, 2 lỗi do thiếu file đính kèm cũ `test-fixtures/Cap_nhat_don_gia_7_phieu_nhap_cu.xlsx` và dữ liệu trích xuất. Thêm fixture tổng hợp có cùng bảy dòng/bốn phiếu cho test UI mock, vẫn ưu tiên file gốc nếu có. Chạy lại riêng hai test đó bằng `--grep 'price update previews seven rows|price updates reject invalid files'`: **2 đạt**. Tổng cộng **17 bài giao diện đã đạt**. Không tuyên bố đã kiểm tra file gốc bị thiếu.
- `reports/receipt-numbers/backend-tests.txt`: log backend. `data-preservation.json`: số dòng và hash mọi bảng public trước/sau, `changed_public_tables=[]`.

Không reset database, không xóa lịch sử, không thay UUID, không thay giao dịch kiểm kê Excelsa. Test dùng schema riêng; các schema test concurrency được dọn riêng, schema test transaction rollback toàn bộ. Dữ liệu public chỉ được đọc để đối chiếu. Không áp dụng migration hoặc ghi mã PN lên dữ liệu thật trong phiên này.
