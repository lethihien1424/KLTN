# Excel đơn mua nguyên liệu

Đã triển khai trong mã nguồn, chưa thay code/restart các container đang chạy và chưa áp dụng migration vào database public.

## Giao diện

Màn hình `/#/don-mua-nguyen-lieu` dùng thứ tự Tải template → Nhập Excel → Xuất Excel → + Tạo đơn mua. Tái sử dụng `pm-btn`, `PageHeader`, `FormDrawer`, `DataTable` và hàm download từ màn hình BOM. Không sửa CSS, sidebar hoặc layout trong thay đổi Excel này. Nút tự xuống hàng theo CSS responsive sẵn có.

Preview hiển thị file, số đơn/dòng, thông tin từng dòng, thành tiền và lỗi theo dòng/cột. Chỉ bật xác nhận khi toàn bộ file hợp lệ và còn đủ quyền. Sau import tải lại danh sách và các thẻ thống kê. Nếu dữ liệu thay đổi sau preview, backend trả lỗi mới và không lưu đơn nào.

## API và quyền

Tiền tố: `/api/don-mua-nguyen-lieu/excel`.

| API | Quyền động trên `don_mua_nguyen_lieu` |
| --- | --- |
| `GET /template` | `XEM`, `THEM`, `NHAP_FILE` |
| `POST /preview` | `XEM`, `THEM`, `NHAP_FILE` |
| `POST /import` | `XEM`, `THEM`, `NHAP_FILE` |
| `GET /export` | `XEM`, `XUAT_EXCEL` |

Hai POST nhận multipart `file`; import yêu cầu thêm `confirmed=true`. Backend kiểm tra từng quyền; không hard-code vai trò, không tự cấp quyền cho người dùng.

Export nhận `search`, `ma_ncc`, `trang_thai`, `ngay_dat_tu`, `ngay_dat_den`; tìm trên mã đơn, tên NCC và mã đề xuất giống bộ lọc giao diện. Xuất toàn bộ chi tiết các đơn khớp bộ lọc, không phụ thuộc phân trang. Tên file `Danh_sach_don_mua_nguyen_lieu_YYYYMMDD.xlsx` theo ngày Việt Nam. Các cột gồm đầy đủ thông tin đặt/nhận/giá snapshot/người tạo, thêm nguồn, mã tham chiếu và ghi chú. Số lượng và giá xuất theo đơn vị lưu trữ của nghiệp vụ hiện tại.

## Import và transaction

- `.xlsx`, sheet `DonMua`, đúng 8 cột tiếng Việt; tối đa 10 MB/10.000 dòng. Có sheet `HuongDan`, `ViDu`. Không nhận công thức, ô lỗi Excel hoặc ô gộp.
- Các dòng chung mã tham chiếu tạo một đơn. NCC, ngày giao, ghi chú phải thống nhất; không trùng nguyên liệu. NCC/nguyên liệu phải hoạt động và có quan hệ cung ứng.
- Số lượng, đơn giá dương, tối đa 2 số lẻ, không vượt cột Numeric; tổng tính bằng Decimal và hàm `line_total` hiện tại. Giá từ file được lưu thành snapshot, không sửa giá cung ứng.
- Đơn vị nhập theo danh mục. Danh mục `g` quy đổi số lượng sang kg và giá sang VND/kg, theo quy ước lưu đơn mua hiện có. Chặn số lượng không thể biểu diễn chính xác với 2 số lẻ kg (cần bội số 10 g).
- Ngày đặt lấy ngày xác nhận theo múi giờ Việt Nam; ngày giao là ngày Excel hoặc ISO, không trước ngày đặt. Người tạo lấy từ tài khoản hiện tại.
- Chặn mã tham chiếu đã dùng hoặc trùng mã đơn chính thức. Chặn đơn cùng NCC/ngày giao/toàn bộ nguyên liệu-số lượng-giá trong file và trong dữ liệu đã có, kể cả đổi mã tham chiếu. Đây là quy tắc chống trùng có chủ đích; thay mã tham chiếu không dùng để nhập lại đơn giống hệt.
- Dùng một transaction cho toàn bộ header, chi tiết và metadata trong file; lỗi SQL/lỗi ghi bất kỳ đơn nào rollback toàn bộ. Advisory lock PostgreSQL tuần tự hóa xác nhận Excel đồng thời; PK/unique metadata chặn dùng lại tham chiếu tại DB.
- Mã đơn/chi tiết do database sinh qua repository hiện tại. Trạng thái luôn `CHUA_DUYET`, `ma_de_xuat=NULL`, chưa nhận số lượng nào. Không gọi luồng duyệt, nhận hàng, tồn kho, phiếu nhận hay BOM/dự báo.
- Chi tiết đơn và export thể hiện nguồn `EXCEL_TRUC_TIEP`, mã tham chiếu, ghi chú. Đơn có đề xuất vẫn giữ nguyên liên kết và luồng phê duyệt hiện có.

## Schema và triển khai

Migration `database/migrations/20261030_purchase_excel.sql` chỉ tạo bảng mới `purchase_excel_import`: mã tham chiếu PK, mã đơn FK/unique, ghi chú. Không ALTER/UPDATE/DELETE đơn cũ, tồn kho hoặc lịch sử. Model được đăng ký trong `src.models`; cơ chế `Base.metadata.create_all` sẵn có cũng tạo bảng này khi backend khởi động với code mới.

Khi triển khai, áp dụng migration bổ sung trước khi phục vụ code mới (hoặc để startup hiện tại tạo bảng), rồi triển khai frontend/backend bằng quy trình dự án. Trong phiên làm việc này chỉ build frontend và test code trong thư mục tạm; chưa triển khai container, chưa chạy startup hay migration trên public. Không commit/push Git.

## File thêm/sửa cho chức năng này

Thêm:

- `backend/src/models/purchase_excel_import.py`
- `backend/src/services/purchase_excel_service.py`
- `backend/src/routes/purchase_excel_routes.py`
- `database/migrations/20261030_purchase_excel.sql`
- `frontend/src/services/purchaseExcelService.ts`
- `frontend/src/pages/don-mua/usePurchaseExcelActions.tsx`
- `backend/tests/test_purchase_excel.py`
- `backend/scripts/test_purchase_excel_isolated.py`
- `frontend/tests/purchase-excel.spec.ts`
- `backend/docs/purchase-order-excel.md`

Bổ sung vào file hiện có (giữ các thay đổi đã có trước phiên):

- `backend/src/models/__init__.py`: đăng ký metadata import.
- `backend/src/routes/don_mua_routes.py`: gắn router Excel.
- `backend/src/services/don_mua_service.py`: bổ sung nguồn/tham chiếu/ghi chú vào chi tiết.
- `backend/src/schemas/don_mua_schema.py`: trường metadata tùy chọn trong response chi tiết.
- `frontend/src/pages/don-mua/DanhSachDonMuaPage.tsx`: nút, preview và tải lại sau import.
- `frontend/src/pages/don-mua/ChiTietDonMuaPage.tsx`: hiển thị nguồn Excel và ghi chú.
- `frontend/src/services/purchaseTypes.ts`: kiểu metadata tùy chọn.

## Kết quả kiểm thử

- `npm run build`: đạt; còn các cảnh báo bundling dependency/chunk của dự án.
- `python scripts/test_purchase_excel_isolated.py`: **14 đạt, 0 lỗi, 0 bỏ qua**. Chạy code workspace trong `/tmp` của container, mỗi test dùng schema PostgreSQL riêng, transaction ngoài rollback cả DDL và dữ liệu. Không chạy app startup.
- `npx playwright test tests/purchase-excel.spec.ts tests/purchase.spec.ts tests/layout-scroll.spec.ts --grep 'purchase Excel|forecast → demand|receipt validates|proposal rejection|sidebar and main'`: **10 đạt**.
- Backend kiểm tra một/nhiều đơn, nhiều NCC/nguyên liệu, Decimal, đơn vị g, lỗi cấu trúc/dòng/cột, dữ liệu không tồn tại/ngừng hoạt động, mapping, chống trùng, xác nhận, RBAC, export 25 đơn/50 chi tiết, mọi bộ lọc, không nhận hàng/cộng kho khi import, duyệt rồi nhận theo luồng cũ, rollback khi lỗi giữa batch và khi FK thực tế thất bại.
- Trình duyệt kiểm tra thứ tự/style/căn hàng bốn nút, template, preview/xác nhận/làm mới thống kê, lỗi sau preview, export đủ bộ lọc, quyền động, responsive; hồi quy đề xuất → tạo đơn → duyệt → nhận hàng, từ chối đề xuất và sidebar desktop/mobile.
- `reports/purchase-excel/backend-tests.txt` chứa log backend. `reports/purchase-excel/data-preservation.json` lưu số dòng/hash **mọi bảng public** trước/sau: `changed_public_tables=[]`. Đơn cũ, lịch sử nhập, kiểm kê Excelsa và các dữ liệu nghiệp vụ không thay đổi trong phiên kiểm thử.

Runner Docker cần HTTPX test trong `/tmp/milano-purchase-excel-test-deps` (hoặc môi trường dev đã có dependency từ `requirements-dev.txt`). Chỉ dependency test được cài vào thư mục tạm, không sửa môi trường package của tiến trình ứng dụng.
