# Giá snapshot trong lịch sử nhập nguyên liệu

## Trạng thái triển khai

Migration `20261030_delivery_prices` đã được áp dụng vào đúng PostgreSQL Docker `milano_coffee` sau khi xác nhận cluster và sao lưu archive đầy đủ. Backend đang chạy có code giá snapshot trùng workspace. API danh sách, chi tiết, template/Preview/Export và hiệu suất NCC đã được kiểm tra qua HTTP thật sau migration; không cần restart backend. Xem `reports/delivery-prices-migration/20261029_180230/verification.json` và `reports/delivery-prices-migration/live-http/verification.json`.

## Migration được đề xuất

`database/migrations/20261030_delivery_prices.sql` bổ sung vào `chi_tiet_phieu_nhan_nguyen_lieu`:

| Cột | Kiểu | Quy tắc |
|---|---|---|
| don_gia_mua | NUMERIC(15,2), nullable | Giá VND tại thời điểm đặt hàng/giá lịch sử được cung cấp, không âm |
| don_vi_don_gia | VARCHAR(20), nullable | Đơn vị mua tương ứng số chấp nhận, ví dụ kg, l; UI ghi VND/kg, VND/l |
| thanh_tien | NUMERIC(30,4), generated stored | `so_luong_nhap_kho * don_gia_mua`; NULL nếu thiếu giá |

Constraint yêu cầu giá và đơn vị giá cùng NULL hoặc giá không âm kèm đơn vị trùng `don_vi`. Không có DEFAULT 0, UPDATE/backfill, DELETE hoặc thay đổi tồn kho. Phiếu cũ giữ nguyên dữ liệu và có giá/thành tiền NULL, kể cả phiếu thực tế cũ chưa từng lưu snapshot giá. Không suy đoán giá cũ từ bảng cung ứng hiện tại.

Migration dùng transaction, advisory lock, lock_timeout 5 giây, kiểm tra cột/constraint đã tồn tại và ghi phiên bản `20261030_delivery_prices`. Đã kiểm thử chạy hai lần và bảo toàn phiếu cũ. Generated stored column có thể cần khóa bảng/tính lại dữ liệu; nếu timeout, transaction rollback, cần chạy lại khi ít truy cập. Không tự gỡ cột khi rollback ứng dụng; backend cũ vẫn bỏ qua các cột nullable mới.

Với môi trường khác, triển khai theo thứ tự: sao lưu database hiện có bằng quy trình vận hành, chạy SQL migration trên đúng PostgreSQL Docker, xác nhận version/cột, build và triển khai backend/frontend. Không dùng `down -v`, reset hoặc seed lại database. Script `backend/scripts/apply_delivery_prices_migration.py --apply` thực hiện xác nhận database/cluster, pg_dump, kiểm tra pg_restore --list, migration và đối chiếu dữ liệu trước/sau. SQL tương đương bằng PowerShell từ thư mục repository:

```powershell
Get-Content -Raw database/migrations/20261030_delivery_prices.sql |
  & 'C:/Program Files/Docker/Docker/resources/bin/docker.exe' exec -i milano_postgres psql -X -v ON_ERROR_STOP=1 -U postgres -d milano_coffee
```

## Nguồn dữ liệu và tính tiền

- Nhận hàng mới: chép `chi_tiet_don_mua.don_gia_vnd_kg` vào giá snapshot trong cùng transaction nhận hàng. Đơn vị mua kg đối với nguyên liệu g/kg; nguyên liệu khác dùng đơn vị mua hiện có của luồng nhận. Không sửa giá đơn mua đã duyệt.
- Import quá khứ: lấy `don_gia_mua` từ Excel; ô trống là chưa có bằng chứng giá. Giá 0 là hợp lệ và khác thiếu giá.
- Giá đã biết của cùng nguyên liệu, cùng NCC và mã đơn cũ phải thống nhất giữa các đợt, cả trong file và với lịch sử đã lưu. Khác đơn được khác giá. Một đợt cũ thiếu giá không bị tự điền khi nhập đợt mới có giá.
- PostgreSQL NUMERIC lưu và nhân chính xác, Python Decimal dùng precision 50 cho Preview/tổng tiền để tránh mất chữ số ở giá trị lớn. UI chỉ định dạng chuỗi tiền từ API, không tính hay cộng tiền bằng Number/float.
- Thành tiền dùng số **chấp nhận** của riêng đợt, không dùng số đặt hoặc số giao. Tổng phiếu NULL nếu bất kỳ dòng nào thiếu giá; không trả tổng một phần như tổng đầy đủ.
- Không đổi transaction, request_id/chống trùng, lũy kế số lượng, cập nhật kho, chất lượng hoặc KPI.

## API

Giữ URL và RBAC hiện có:

- `GET /api/giao-nguyen-lieu/lich-su` và `/phieu/{code}`: từng chi tiết thêm `don_gia_mua`, `don_vi_don_gia`, `thanh_tien`; cấp phiếu thêm `tong_gia_tri_nhap`.
- API lịch sử theo đơn và hiệu suất NCC cũng có các trường snapshot mới trên dòng qua `DeliveryService.history`.
- `GET .../excel/template`: tải template v2.
- `POST .../excel/preview` và `/import`: từng nhóm `items` thêm `chi_tiet` chứa giá, số chấp nhận, đơn vị giá, thành tiền; thêm `tong_gia_tri_nhap`. Các trường cũ giữ nguyên.
- `GET .../excel/export`: giữ các cột cũ và thêm Đơn giá mua (VND), Đơn vị đơn giá, Thành tiền (VND), Tổng giá trị nhập (VND). Tổng phiếu lặp theo dòng để giữ ngữ cảnh phiếu; khi cộng chi phí theo dòng, dùng cột Thành tiền, không cộng cột tổng phiếu.

Các trường tiền trong JSON là chuỗi Decimal hoặc null. Giá trị tiền export cũng là chuỗi thập phân chính xác, tránh giới hạn 15 chữ số của ô số Excel. Dòng/phiếu thiếu giá export rõ `Chưa có giá`.

## Tương thích Excel

Sheet vẫn là `LichSuGiaoHang`.

- v1: 15 cột A:O như cũ, tiếp tục import; snapshot giá NULL.
- v2: giữ nguyên A:O, thêm **P1 = don_gia_mua**. Mẫu mới có hướng dẫn phiên bản và đơn vị. Ô giá có thể trống; giá nhập phải hữu hạn, không âm, tối đa 15 chữ số/2 số thập phân. Không cho công thức/ô lỗi Excel.
- Không dùng tên file để nhận phiên bản. Chỉ P1 đúng `don_gia_mua` mới cho phép cột thứ 16; cột dư thật ngoài phiên bản vẫn bị từ chối theo tọa độ.
- Giữ `reset_dimensions()`, bỏ qua ô trống chỉ có định dạng và giới hạn 10.000 dòng dữ liệu thật. File 7 dòng có P10050 trống có định dạng vẫn được hỗ trợ.
- Lỗi giá nêu cột P và dòng cụ thể, ví dụ `don_gia_mua (P3)`.

## UI

Danh sách thêm Tổng giá trị nhập. Popup giữ nội dung hiện có và thêm Đơn giá, đơn vị giá, Thành tiền và tổng phiếu ở cuối. Thiếu giá hiển thị `Chưa có giá`; giá 0 hiển thị `0 ₫`. Lịch sử nhận theo đơn/NCC cũng hiển thị giá snapshot. Preview hiển thị giá/thành tiền theo nguyên liệu và tổng đợt. Thứ tự nút Tải template → Nhập Excel → Xuất Excel không đổi.

## Kiểm thử

- **80/80 backend PASS**, 0 fail/error/skip: parser, API lịch sử, nhận hàng, giá snapshot, migration và tồn kho. Trong đó có 15 test mới về Decimal/giá (13 PostgreSQL + 2 Decimal).
- **9/9 Playwright PASS** trong `frontend/tests/delivery-history.spec.ts`: danh sách, popup, Preview, template/export, import, thiếu giá/giá 0, số tiền lớn, bộ lọc và RBAC. API được mock, không ghi dữ liệu thật.
- `npm run build`: **PASS** (TypeScript + Vite). Có các cảnh báo thư viện/chunk hiện hữu, không có lỗi build.
- Fingerprint số dòng và MD5 nội dung của tất cả bảng public trước/sau backend test giống nhau: `changed_tables=[]`. Không thay tồn kho Milano hoặc giao dịch Excelsa.
- Không reset DB, xóa lịch sử, commit hoặc push.

Bằng chứng: `reports/delivery-prices/backend-tests.txt`, `reports/delivery-prices/verification.json`. Backend test dùng workspace source trong thư mục tạm Docker, không gọi startup ứng dụng; schema/transaction test được rollback. Script chạy lại: `python backend/scripts/test_delivery_prices_isolated.py`. TestClient cần dependency tạm `/tmp/delivery-preview-test-deps` đã chuẩn bị trong phiên này; nếu container mới chưa có, cài riêng `httpx2` vào thư mục đó trước, không thay thư viện của tiến trình API.

Các file triển khai chính: model phiếu nhận, `delivery_service.py`, `delivery_history_service.py`, `delivery_excel_service.py`, `delivery_pricing_service.py`, migration SQL, frontend `deliveryService.ts`, `LichSuNhapNguyenLieuPage.tsx`, `DeliveryHistoryTable.tsx`, `useDeliveryExcel.tsx`. Test thay đổi: parser và delivery-history Playwright; thêm `test_delivery_prices.py` cùng script test cô lập.
