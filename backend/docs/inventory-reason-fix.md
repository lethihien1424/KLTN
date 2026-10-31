# Sửa lỗi dropdown lý do và ly_do_id trong cập nhật tồn kho

## Nguyên nhân thực tế

Đã kiểm tra backend Docker đang chạy và database `milano_coffee` trong container `milano_postgres` (PostgreSQL 16, cluster ID `7690187069159739426`). Không dùng PostgreSQL native trên Windows để kết luận trạng thái dữ liệu của ứng dụng.

| Request thật trước sửa | HTTP | Response/đặc điểm |
|---|---|---|
| `GET /api/ly-do/ap-dung?chuc_nang=DIEU_CHINH_TON_KHO` | 500 | `Lỗi máy chủ: 'DIEU_CHINH_TON_KHO'`; không có `Access-Control-Allow-Origin` |
| `PUT /api/ton-kho-nguyen-lieu/NL0002/2026-09-01`, `ly_do_id=""` | 422 | `String should have at least 1 character`, tại `body.ly_do_id`; có CORS |

1. `FunctionCode` đã chấp nhận `DIEU_CHINH_TON_KHO`, nhưng dictionary kiểm tra quyền bên trong endpoint `/ly-do/ap-dung` chỉ có ba nghiệp vụ đổi trạng thái. Truy cập khóa tồn kho gây `KeyError`, trả 500.
2. Handler lỗi 500 chạy ngoài CORS middleware nên response thiếu header CORS. Trình duyệt không đọc được HTTP 500 và `fetch` thất bại, hiển thị “Không thể kết nối máy chủ”. Đây là lỗi server bị CORS che, không phải mất kết nối thật.
3. Khi lý do tải lỗi, form bỏ phần select khỏi DOM nhưng vẫn cho bấm Lưu. Không có guard kiểm tra `ly_do_id` ở hàm lưu, nên có thể gửi chuỗi rỗng. Pydantic từ chối đúng; UI lại đưa nguyên thông báo kỹ thuật ra màn hình.
4. Database thực tế **đã có** ba lý do đang hoạt động, constraint, ba bảng kho mới và trigger bảo vệ kế hoạch do startup tạo. `schema_migrations` còn thiếu version `20261028_inventory_ledger`. Không thiếu bản ghi lý do trong database này.

`reasonService.ts` đã đúng URL/param và dùng `reason.id` làm giá trị dropdown; không cần đổi cấu hình dịch vụ này.

## Thay đổi

| File sửa/tạo | Nội dung |
|---|---|
| `backend/src/routes/ly_do_routes.py` | Bổ sung ánh xạ quyền tồn kho: THEM/SUA/NHAP_FILE; kiểm tra đúng chức năng bằng quyền động. Khóa chưa hỗ trợ trả 422, không gây KeyError |
| `backend/src/core/error_handlers.py` (mới), `backend/src/main.py` | Handler 500 trả thông báo dễ hiểu, giữ status/CORS cho origin đã cấu hình; không trả exception nội bộ cho client |
| `frontend/src/pages/ton-kho/TonKhoNguyenLieuPage.tsx` | Giữ dropdown và textarea, thêm nút Hủy; khóa Lưu khi đang tải/lỗi/không có lý do; hướng dẫn cấu hình, thử lại; validation lý do trước request; Khác phải có ghi chú |
| `frontend/src/services/tonKhoService.ts` | Chặn ID rỗng ngay ở service; gửi đúng `id`; đổi lỗi validation trường lý do từ backend sang thông báo tiếng Việt; tiếp tục loại book khỏi payload điều chỉnh |
| `frontend/src/services/apiClient.ts` | Giữ `detail` có cấu trúc trong `ApiError` để service có thể dịch lỗi theo ngữ cảnh; giữ HTTP status và cách xử lý lỗi mạng riêng |
| `backend/src/services/stock_schema_service.py` | Ghi nhận migration version khi nâng cấp thành công và bỏ qua SQL đã chạy ở các lần startup sau |
| `database/migrations/20261028_inventory_ledger.sql` | Sinh lại migration, bổ sung ghi nhận phiên bản trong cùng transaction |
| `backend/reason_tests/test_inventory.py` | Test endpoint lý do thật qua RBAC, lý do từ cấu hình → điều chỉnh → lịch sử, migration tracking |
| `backend/reason_tests/test_inventory_errors.py` (mới) | Test HTTP 500/CORS và không lộ exception, không cần tải Prophet |
| `frontend/tests/inventory.spec.ts` | Bổ sung Excelsa, ID khác mã lý do, ghi chú, validation, lỗi HTTP/mạng, thiếu cấu hình, Hủy và đồng bộ lịch sử |
| `frontend/playwright.live.config.ts`, `frontend/tests/inventory-live.spec.ts` (mới) | Test trình duyệt thật trên Docker, chỉ kiểm tra validation/Hủy, không lưu số tồn thử nghiệm |
| `backend/scripts/diagnose_inventory_reason.py` (mới) | Chẩn đoán chỉ đọc schema/data và HTTP thật; token chỉ dùng trong bộ nhớ, không in ra |
| `backend/scripts/backup_inventory_migration_state.py` (mới) | Xác minh cùng cluster/database, sao lưu, kiểm tra archive/fingerprint và ghi nhận version đã đủ cấu trúc |
| `backend/scripts/verify_inventory_reason_live.py` (mới) | Chạy test trình duyệt thật bằng token trong bộ nhớ, so fingerprint trước/sau |

Không sửa BOM, thuật toán dự báo, thiết kế chung hoặc quyền theo tên vai trò. Không bỏ validation backend.

## Migration, sao lưu và cập nhật dịch vụ

- Trước thao tác, script kiểm tra backend và PostgreSQL Docker trỏ cùng database/cluster; xác minh đủ bảng/cột, lý do, constraint, trigger và generated column tồn khả dụng.
- Đã sao lưu đầy đủ database bằng `pg_dump -Fc`, kiểm tra đọc archive bằng `pg_restore --list`.
- Backup: `reports/inventory-reason-fix/20261028_164652/milano_coffee_before.dump` (117.537 bytes).
- SHA-256: `8896224412eff178e1eb2988ba15b6f4235cd4f406442e01c9ee8f4c65ab79df`.
- Báo cáo sao lưu/đối soát: `reports/inventory-reason-fix/20261028_164652/verification.json`.
- Vì tác dụng của migration đã tồn tại đầy đủ, **không chạy lại DDL, seed hoặc backfill**. Chỉ bổ sung version `20261028_inventory_ledger` vào `schema_migrations` sau khi backup và đối soát. Phiên bản đã được ghi nhận lúc `2026-10-28 23:46:56 +07`.
- Đã rebuild `backend`/`frontend`, chạy `compose up -d --no-deps --no-build backend frontend` bằng Docker CLI chính thức. Không restart PostgreSQL, không chạy down, không tác động volume.
- PostgreSQL giữ thời điểm bắt đầu `2026-10-28T15:14:17.881618112Z`. Hai container ứng dụng đã chạy image mới; backend health 200, frontend đã được kiểm tra bằng trình duyệt thật.
- Fingerprint trước/sau của nguyên liệu, 13 snapshot tồn kho, 26 kế hoạch sản xuất, 3 đơn mua/4 chi tiết và các bảng sổ kho đều khớp. Không ghi giao dịch thử vào sổ kho nghiệp vụ.

## API và nghiệp vụ sau sửa

- `GET /api/ly-do/ap-dung?chuc_nang=DIEU_CHINH_TON_KHO`: **200**, trả ba lý do đang sử dụng và áp dụng đúng nghiệp vụ, có CORS. Dữ liệu được đọc từ Quản lý lý do.
- `PUT /api/ton-kho-nguyen-lieu/{material}/{date}`: vẫn bắt buộc `ly_do_id` hợp lệ. ID rỗng vẫn bị backend chặn 422; frontend chặn trước khi gọi API và hiển thị **“Vui lòng chọn lý do điều chỉnh tồn kho”**. ID không tồn tại hoặc sai nghiệp vụ vẫn bị từ chối.
- Lưu hợp lệ dùng transaction hiện có: thực tế mới, generated khả dụng, lý do/ghi chú/người/thời gian/tồn trước-sau cùng commit. Không gửi thay đổi book từ form.
- Lưu thành công làm mới bảng/thẻ; mở chi tiết lấy lịch sử mới. Test mô phỏng Excelsa trong schema riêng xác nhận `34 → 70`, book `47` giữ nguyên, khả dụng `23`, lưu đúng lý do/ghi chú/người/thời gian.
- Dữ liệu Excelsa thật `NL0002/2026-09-01` vẫn là **34 thực tế, 47 đã book, -13 khả dụng**. Không tự thay số tồn thật để thử chức năng.
- API template/import/export/nhận hàng được giữ nguyên; kiểm thử transaction và RBAC vẫn qua.

## Kết quả kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| PostgreSQL/API tồn kho + lý do + lỗi/CORS | **28/28 qua**; dữ liệu/schema test riêng rollback |
| Playwright tồn kho, gồm Excel và xuất sản xuất | **11/11 qua**; gồm lỗi HTTP 500, mất mạng thật giả lập, thử lại, không cấu hình lý do, Hủy và validation |
| Trình duyệt thật trên ứng dụng Docker | **1/1 qua**; không mock API; mở Excelsa, nhận lý do 200, validation tiếng Việt, chọn lý do/nhập ghi chú rồi Hủy, không phát PUT |
| TypeScript/Vite build | Qua |
| Docker build backend/frontend và health sau cập nhật | Qua |
| `git diff --check` | Qua |
| Fingerprint dữ liệu nghiệp vụ sau browser test thật | Khớp trước/sau |

Kết quả live: `reports/inventory-reason-fix/live-verification.json`. Token test không được ghi vào report/trace. Test lưu hợp lệ đã chạy trong schema PostgreSQL riêng; trình duyệt thật chỉ thực hiện thao tác không ghi dữ liệu để giữ nguyên tồn thật của người dùng.

Lệnh tái hiện:

```powershell
# Trong backend, chạy PostgreSQL test riêng trên môi trường test cục bộ:
$env:DB_HOST = '127.0.0.1'
$env:INVENTORY_TEST_POSTGRES = '1'
python -m unittest discover -s reason_tests -p 'test_inventory*.py' -v

# Trong frontend:
npx playwright test tests/inventory.spec.ts
npm run build

# Từ gốc repo, xác minh chỉ đọc migration và test trình duyệt Docker không lưu:
python backend/scripts/backup_inventory_migration_state.py --expected-database milano_coffee
python backend/scripts/verify_inventory_reason_live.py
```
