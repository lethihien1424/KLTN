# Import/Export Excel công thức BOM

## Giao diện và dữ liệu

Header dùng cùng kiểu nút với Quản lý nguyên liệu, theo thứ tự:

`Tải template → Nhập Excel → Xuất Excel → + Thêm công thức`.

Không thay đổi sidebar, header dùng chung hoặc CSS bố cục. Giữ chức năng thêm/sửa/xem và hộp chọn lý do đổi trạng thái. Nút đổi trạng thái sử dụng alias `CONG_THUC_CONFIRM`, tương ứng quyền `cong_thuc/XAC_NHAN` đã có ở backend.

Template `Template_cong_thuc_BOM.xlsx` có ba sheet:

- `BOM`: nhập dữ liệu thật, dòng 1 giữ nguyên đủ 9 cột.
- `HuongDan`: hướng dẫn trường bắt buộc, đơn vị, tỷ lệ, cách nhóm dòng và xác nhận import.
- `ViDu`: một công thức minh họa có hai nguyên liệu. Sheet này không được nhập vào hệ thống.

Các cột theo thứ tự:

```text
ma_cong_thuc
ten_cong_thuc
ma_san_pham
khoi_luong_thanh_pham_kg
he_so_thu_hoi
ty_le_hao_hut
ma_nguyen_lieu
ty_le_phoi_tron
trang_thai
```

Mỗi nguyên liệu là một dòng; lặp lại thông tin công thức trên các dòng có cùng mã. Các dòng phải nhất quán về tên, sản phẩm, thu hồi, hao hụt và trạng thái. Không gộp hai công thức khác nhau bằng cùng mã.

Khối lượng có thể để trống để lấy khối lượng chuẩn từ `san_pham`; nếu nhập phải là kg và khớp danh mục. Không cập nhật sản phẩm từ file. Tỷ lệ là số 0–1, tối đa 4 chữ số thập phân; ví dụ số `0.85` hoặc ô Excel định dạng phần trăm `85%`.

## Kiểm tra và transaction

- Chỉ `.xlsx`, tối đa 10 MB và 10.000 dòng dữ liệu; đúng sheet `BOM` và tên/thứ tự 9 cột. Không chấp nhận ô công thức Excel trong sheet dữ liệu.
- Kiểm tra mã mới, trường bắt buộc, độ dài, sản phẩm/nguyên liệu tồn tại và còn hoạt động, khối lượng chuẩn hợp lệ.
- Kiểm tra thu hồi `(0;1]`, hao hụt `[0;1)`, tổng thu hồi + hao hụt bằng 1; từng tỷ lệ phối trộn `(0;1]`, tổng bằng 1, không trùng nguyên liệu.
- Kiểm tra mỗi sản phẩm chỉ có một BOM `DANG_SU_DUNG`, bao gồm cả dữ liệu đã có và các công thức trong file.
- Preview chỉ đọc, trả mã công thức, các dòng Excel và nguyên nhân lỗi; không tạo BOM/chi tiết.
- Khi xác nhận, kiểm tra lại toàn bộ dữ liệu và quyền. Nếu dữ liệu đã thay đổi khiến file không còn hợp lệ, trả báo cáo lỗi mới và không lưu.
- Import toàn bộ file trong một transaction: có lỗi kiểm tra hoặc lỗi ghi ở công thức bất kỳ thì không lưu dở bất kỳ công thức/chi tiết nào. Không ghi đè hoặc cập nhật BOM cũ.
- Khóa độc quyền hàng sản phẩm theo thứ tự mã khi import; các thao tác tạo/sửa/kích hoạt thủ công dùng cùng hàng khóa và kiểm tra BOM hoạt động, tránh hai luồng cùng tạo BOM hoạt động cho một sản phẩm.
- Mã công thức có thể nhập rõ ràng. Khi tạo thủ công trên PostgreSQL, bộ sinh mã dùng sequence hiện tại và bỏ qua mã đã được import chiếm trước; không reset sequence.

## API và RBAC

| API | Quyền hiện có |
| --- | --- |
| `GET /api/cong-thuc/excel/template` | `cong_thuc/NHAP_FILE` |
| `POST /api/cong-thuc/excel/preview` | `cong_thuc/NHAP_FILE` |
| `POST /api/cong-thuc/excel/import` | `cong_thuc/NHAP_FILE` |
| `GET /api/cong-thuc/excel/export` | `cong_thuc/XUAT_EXCEL` |

POST dùng multipart `file`; endpoint import yêu cầu thêm `confirmed=true`. File thiếu trường xác nhận không được ghi. Endpoint cũ `POST /api/imports/cong-thuc` cũng dùng cơ chế mới: template mới, quyền `NHAP_FILE` và `confirmed=true`. Client cũ cần cập nhật theo định dạng này.

Tái sử dụng quyền đã có trong permission catalog và alias frontend `IMPORT_CONG_THUC`, `CONG_THUC_EXPORT`; không tự cấp quyền cho vai trò hoặc chỉnh dữ liệu RBAC. Backend kiểm tra quyền độc lập với trạng thái nút trên giao diện, bao gồm cả đường dẫn import cũ.

Export nhận `search`, `ma_san_pham`, `trang_thai`, dùng cùng truy vấn lọc với danh sách. Xuất tất cả công thức phù hợp và toàn bộ dòng nguyên liệu, không giới hạn theo trang đang xem. Công thức cũ thiếu chi tiết vẫn có một dòng thể hiện thông tin công thức. Tên file `Danh_sach_cong_thuc_BOM_YYYYMMDD.xlsx`, ngày theo múi giờ Việt Nam. Tên/mã được ghi dạng văn bản, không bị Excel diễn giải thành công thức.

## Đồng bộ định lượng

BOM import ghi vào chính bảng công thức/chi tiết mà popup và `QuyDoiBomService` đang sử dụng. Không lưu các số kg tính sẵn từ Excel.

```text
kg thành phẩm = khối lượng chuẩn sản phẩm sau quy đổi đơn vị
kg đầu vào = kg thành phẩm / hệ số thu hồi
kg nguyên liệu = kg đầu vào × tỷ lệ phối trộn
kg hao hụt = kg đầu vào − kg thành phẩm
nhu cầu kg = số sản phẩm dự báo × kg nguyên liệu cho 1 sản phẩm
```

Không cộng hao hụt thêm lần nữa. Khi người dùng tính lại nhu cầu, module lấy BOM đang hoạt động hiện tại. Import không cập nhật lịch sử dự báo, tồn kho, đơn mua hoặc thuật toán Prophet.

## File thay đổi trong phần Excel

| File | Nội dung |
| --- | --- |
| `backend/src/services/bom_excel_service.py` | Template, đọc/kiểm tra, báo lỗi, import transaction và export |
| `backend/src/routes/cong_thuc_routes.py` | API Excel có RBAC phía server |
| `backend/src/routes/import_routes.py` | Đường dẫn import cũ dùng cùng quyền và cơ chế xác nhận |
| `backend/src/repositories/cong_thuc_repository.py` | Kiểm tra BOM hoạt động, khóa tham chiếu và tránh trùng mã sinh tự động |
| `backend/src/services/cong_thuc_service.py` | Giữ quy tắc một BOM hoạt động trên các thao tác thủ công |
| `frontend/src/services/bomExcelService.ts` | Upload kiểm tra/xác nhận và tải file có token |
| `frontend/src/pages/cong-thuc/useBomExcelActions.tsx` | Bộ nút Excel, chọn file, popup báo lỗi/xác nhận và phản hồi |
| `frontend/src/pages/cong-thuc/CongThucPage.tsx` | Tích hợp bộ nút, lọc xuất và cập nhật danh sách/thống kê |
| `backend/reason_tests/test_bom_excel.py` | Test HTTP/RBAC, import thực trên SQLite bộ nhớ, rollback, export và CRUD |
| `frontend/tests/bom-excel.spec.ts` | Test trình duyệt bộ nút, tải file, bộ lọc, dòng lỗi và xác nhận |
| `backend/docs/bom_excel.md` | Báo cáo này |

Giữ nguyên các thay đổi từ phần định lượng và Excel nguyên liệu đã triển khai trước đó.

## Kết quả kiểm thử

| Lệnh | Kết quả |
| --- | --- |
| `cd backend` rồi `python -m unittest discover -s reason_tests -p test_bom_excel.py -v` | PASS 12/12 |
| `cd backend` rồi `python -m unittest discover -s reason_tests -p test_bom_quantities.py -v` | PASS 7/7 |
| `cd frontend` rồi `npx playwright test tests/bom-excel.spec.ts tests/bom-quantities.spec.ts` | PASS 9/9 |
| `cd frontend` rồi `npm run build` | PASS TypeScript và Vite build |

Test backend dùng database SQLite bộ nhớ tách biệt; kiểm tra mã sequence PostgreSQL bằng mock. Test trình duyệt dùng API giả lập để kiểm tra luồng UI; tính toán và transaction được kiểm tra riêng qua HTTP API và service thật. Không chạy ghi dữ liệu trên database nghiệp vụ, không reset database.

Test tích hợp xác nhận: sau import BOM Classic 250g, thu hồi 85%, phối trộn 85%/15%, dự báo 1.000 sản phẩm cho nhu cầu Robusta `250.00 kg`, Arabica `44.12 kg`. Một BOM khác trạng thái ngừng sử dụng không tham gia tính. Sau khi người dùng đổi trạng thái để kích hoạt BOM mới thu hồi 100% và phối trộn 50%/50%, tính lại trả `125.00 kg` mỗi nguyên liệu; số dự báo và dữ liệu tồn kho ban đầu không bị thay đổi.
