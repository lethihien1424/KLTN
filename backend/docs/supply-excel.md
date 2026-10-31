# Excel – Nguyên liệu cung ứng (29/10/2026)

## Kết quả rà soát và phạm vi

Workspace có nhiều thay đổi chưa commit của các đợt BOM, tồn kho, nhận hàng và hiệu suất NCC. Giữ nguyên các thay đổi đó, không reset/ghi đè. Báo cáo này chỉ mô tả phần Excel cung ứng được tiếp tục hoàn thiện.

Đã có trước: CRUD cung ứng, schema kiểm tra số liệu, repository tìm kiếm/lọc NCC, importer `_import_nguyen_lieu_ncc`, tính lại điểm NCC, quyền động nhập/xuất và tiện ích tải file Excel của BOM. Màn hình cung ứng chưa nối ba nút Excel, chưa có preview/confirm và endpoint template/export chuyên dụng. Đã bổ sung các phần thiếu, tái sử dụng importer/schema/repository thay vì viết lại nghiệp vụ.

## Hành vi

- Ba nút Tải template – Nhập Excel – Xuất Excel dùng kiểu nút và drawer hiện có; không đổi sidebar, màu sắc hoặc bảng hiện tại.
- Template `.xlsx`: sheet `CungUng` gồm `ma_ncc`, `ma_nguyen_lieu`, `don_gia_nguyen_lieu`, `so_luong_ton_kho`, `so_luong_book`, `so_luong_xuat`, `lead_time_ngay`, `ty_le_chat_luong_dat`, `ty_le_giao_dung_han`, `ty_le_giao_du`; sheet `HuongDan` giải thích đơn vị và quy tắc.
- Các lượng tồn/book/xuất trong file là dữ liệu **NCC**, không phải tồn Milano. Đơn vị lấy từ danh mục nguyên liệu; không thay đơn vị/quy đổi bằng Excel. Tỷ lệ 0–1; giá dương; số lượng không âm; book/xuất không vượt tồn NCC; lead time nguyên dương trong giới hạn integer DB.
- Chỉ tạo cặp NCC–nguyên liệu mới. Cặp có sẵn, trùng trong file, mã không tồn tại, công thức Excel, cấu trúc sai, dữ liệu sai đều bị chặn. Không gộp hoặc ghi đè âm thầm. Chỉnh sửa cặp cũ bằng chức năng hiện có.
- Tối đa 10 MB/10.000 dòng. Preview không ghi dữ liệu; xác nhận kiểm tra lại toàn bộ trong transaction rồi gọi importer cũ. Lỗi bất kỳ dòng nào hoặc lỗi tính điểm sẽ rollback cả file.
- Import tính lại điểm NCC theo cơ chế sẵn có. Khóa NCC theo thứ tự trước khi sửa mapping để đồng bộ với bước tính lại điểm; không sửa cấu hình quyền.
- Export toàn bộ kết quả theo tìm kiếm/NCC, không giới hạn trang. Gồm 15 trường thông tin NCC/nguyên liệu/đơn vị/giá/tồn/book/xuất/khả dụng NCC/lead time/ba tỷ lệ. Ô số giữ kiểu số, tỷ lệ định dạng %, text được bảo vệ khỏi diễn giải thành công thức. File xuất là báo cáo, không phải template nhập.
- Hủy preview không gửi import. Lỗi HTTP giữ thông báo từ máy chủ; file lỗi không cho xác nhận.

## API và RBAC hiện tại

Tiền tố `/api/nguyen-lieu-nha-cung-cap`:

| API | Quyền động được tái sử dụng |
|---|---|
| GET `/excel/template` | `nguyen_lieu_nha_cung_cap / NHAP_FILE` |
| POST `/excel/preview?ma_ncc=...` | `nguyen_lieu_nha_cung_cap / NHAP_FILE` |
| POST `/excel/import?ma_ncc=...` (`file`, `confirmed`) | `nguyen_lieu_nha_cung_cap / NHAP_FILE` |
| GET `/excel/export?search=...&ma_ncc=...` | `nguyen_lieu_nha_cung_cap / XUAT_EXCEL` |

CRUD và API import tổng quát cũ được giữ. Không thêm quyền, không hard-code vai trò, không thay dữ liệu RBAC. UI dùng alias quyền hiện tại; backend kiểm tra độc lập. Excel cung ứng không cần migration.

## File tạo/sửa cho phần cung ứng

Tạo:

- `backend/src/services/supply_excel_service.py`
- `backend/reason_tests/test_supply_excel.py`
- `backend/scripts/verify_supply_excel_live.py`
- `frontend/src/services/supplyExcelService.ts`
- `frontend/src/pages/nha-cung-cap/useSupplyExcelActions.tsx`
- `frontend/tests/supply-excel.spec.ts`
- `frontend/tests/supply-live.spec.ts`
- `backend/docs/supply-excel.md`

Sửa:

- `backend/src/routes/nguyen_lieu_nha_cung_cap_routes.py`: bốn endpoint Excel trước route tham số động.
- `backend/src/services/nguyen_lieu_nha_cung_cap_service.py`: thống nhất thứ tự khóa khi tạo/sửa.
- `backend/src/services/nha_cung_cap_service.py`: helper khóa NCC cho tính lại điểm (file cũng có thay đổi của đợt hiệu suất NCC).
- `backend/src/services/data_processing/import_service.py`: dùng cùng thứ tự khóa, giữ handler cũ.
- `frontend/src/pages/nha-cung-cap/NguyenLieuNhaCungCapPage.tsx`: nối ba nút/preview/làm mới, tìm kiếm thống nhất export.
- `frontend/playwright.live.config.ts`: thêm bài kiểm tra cung ứng trên ứng dụng thật, tắt trace để không lưu token.

## Kiểm thử

Lệnh PostgreSQL tại `backend` (PowerShell):

```powershell
$env:DB_HOST='127.0.0.1'
$env:INVENTORY_TEST_POSTGRES='1'
python -m unittest discover -s reason_tests -p test_supply_excel.py -v
python -m unittest discover -s reason_tests -p test_delivery.py -v
```

- Excel cung ứng: **15/15 PASS**. Bao phủ template; preview; xác nhận; gọi lại importer cũ; lỗi định dạng/công thức/tham chiếu/số liệu; trùng; kiểm tra lại sau preview; lọc NCC; rollback; export 25 dòng và bộ lọc; quyền động/API/CRUD cũ. Mỗi test đối chiếu tồn Milano và đảm bảo không tạo giao dịch kho/đơn mua.
- Nhận hàng/hiệu suất NCC: **15/15 PASS** (chạy lại, gồm nhận nhiều đợt, retry, chất lượng, rollback, import lịch sử không cộng tồn, RBAC).
- `npx playwright test tests/supply-excel.spec.ts tests/delivery.spec.ts`: **8/8 PASS**, gồm 5 bài Excel cung ứng và 3 bài nhận hàng/hiệu suất.
- `npm run build`: **PASS**, TypeScript và Vite thành công. Còn cảnh báo thư viện `use client`, mixed dynamic/static imports và bundle lớn của dự án.
- Regression tồn kho 27 bài + xử lý lỗi 1 bài, BOM 28 bài, nhu cầu nguyên liệu 7 bài; frontend tồn kho/nhận hàng và luồng mua hàng liên quan đã PASS ở bước trước. Không tuyên bố toàn bộ test repository PASS: một số test RBAC cũ còn import `get_authorization` đã không tồn tại.

Fixture PostgreSQL dùng schema tạm bên trong transaction rollback trên DB localhost; không sửa bảng public của Milano Docker. Rebuild/recreate chỉ backend/frontend; không thao tác volume hoặc restart PostgreSQL.

Xác minh trực tiếp được ghi tại `reports/supply-excel/live-verification.json`: fingerprints toàn bộ bảng public trước triển khai và sau kiểm tra; HTTP template/export theo lọc/preview hợp lệ và trùng; import bị từ chối vì trùng hoặc chưa xác nhận; trình duyệt tải file, preview lỗi và hủy. Không commit một import hợp lệ trên dữ liệu thật để làm test; import thành công và rollback lỗi được kiểm tra trong fixture PostgreSQL.

Kết quả cuối: HTTP **PASS**, Playwright live **1/1 PASS**, `deployment_business_unchanged=true`, `business_unchanged=true`. Backend/frontend đã rebuild và cập nhật thành công; backend healthy, PostgreSQL giữ nguyên dịch vụ/dữ liệu.

Đối soát triển khai phát hiện thêm đúng một nhật ký `DANG_NHAP / THANH_CONG` trong thời gian làm việc. Vì vậy `deployment_unchanged` cho toàn bộ bảng là false. Kiểm tra lại hash các nhật ký cũ sau khi loại bản ghi đăng nhập mới khỏi phép tính (không xóa dữ liệu), đồng thời xác nhận mọi bảng khác không đổi. `deployment_business_unchanged` phản ánh kết quả này; không bỏ qua hoặc sửa log để làm đẹp kết quả. Riêng trước/sau kiểm thử Excel trực tiếp, toàn bộ bảng giữ nguyên (`business_unchanged=true`).

## Migration và giới hạn

Excel cung ứng không thêm/sửa bảng. Migration `20261029_delivery_history` thuộc đợt nhận hàng trước, đã được áp dụng sau backup và đối chiếu dữ liệu; xem `supplier-delivery-implementation.md`. Không reset/xóa dữ liệu.

Import hiện chỉ thêm cặp mới; không có cơ chế cập nhật hàng loạt cặp đã có. Dữ liệu tồn NCC do người dùng cấu hình, chưa có tích hợp đối soát tự động. Không thay đổi phạm vi này trong tác vụ Excel.
