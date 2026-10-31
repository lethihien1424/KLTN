# Báo cáo hoàn thiện tồn kho nguyên liệu

> Cập nhật sau triển khai: lỗi dropdown lý do đã được sửa, database Docker đã được sao lưu/đối soát migration và backend/frontend đã rebuild. Xem [báo cáo sửa lỗi lý do](inventory-reason-fix.md). Nội dung dưới đây ghi nhận giai đoạn triển khai ban đầu.

## 1. Rà soát và dữ liệu thực tế

Xem [rà soát ban đầu](inventory-audit.md). Tái sử dụng snapshot, CRUD, transaction nhận hàng một lần, quy đổi BOM, truy vấn tồn mới nhất/hàng đang về và RBAC động hiện có.

Database trong `.env` trỏ hostname Docker `postgres`, không kết nối được từ Windows host. Kiểm tra chỉ đọc qua `DB_HOST=127.0.0.1` thành công: có bảng tồn kho và kế hoạch, nhưng cả hai đang trống. Không có dữ liệu Excelsa/Arabica để xác minh nguồn các số 47/149 đã giữ. Không chỉnh `.env`, không áp migration hay ghi dữ liệu lên schema nghiệp vụ trong phiên triển khai này. PostgreSQL integration tests dùng schema riêng trong transaction và rollback cả DDL sau từng test.

## 2. File tạo mới

| File | Vai trò |
|---|---|
| `backend/src/models/stock_movement_model.py` | Sổ giao dịch, giữ nguyên liệu theo kế hoạch/BOM, mã yêu cầu xuất |
| `backend/src/services/stock_accounting_service.py` | Khóa nguyên liệu, kiểm kê, kiểm tra lý do, ghi trước/sau |
| `backend/src/services/stock_production_service.py` | Giữ theo BOM, xuất từng đợt, hủy phần giữ, chống xuất lặp |
| `backend/src/services/stock_detail_service.py` | Chi tiết, nguồn giữ, lịch sử thực, đơn mua và kế hoạch |
| `backend/src/services/stock_excel_service.py` | Template, preview, import transaction và export |
| `backend/src/services/stock_schema_service.py` | Nâng cấp lý do và bảo vệ kế hoạch đã giữ/xuất |
| `database/migrations/20261028_inventory_ledger.sql` | Migration SQL bổ sung, chạy lặp an toàn |
| `backend/scripts/export_inventory_migration.py` | Sinh migration từ model, không kết nối DB |
| `backend/scripts/audit_inventory.py` | Đối soát chỉ đọc |
| `backend/reason_tests/test_inventory.py` | 24 kiểm thử PostgreSQL/API |
| `frontend/src/pages/ton-kho/StockDetailDrawer.tsx` | Popup 3 tab |
| `frontend/src/pages/ton-kho/StockProductionDrawer.tsx` | Thao tác giữ/xuất/hủy giữ ngay trong trang tồn kho |
| `frontend/src/pages/ton-kho/useStockExcelActions.tsx` | Header Excel, preview và xác nhận |
| `frontend/src/pages/ton-kho/stock.css` | Cảnh báo, thông tin chi tiết, responsive cục bộ |
| `frontend/tests/inventory.spec.ts` | 5 kịch bản trình duyệt |
| `backend/docs/inventory-audit.md`, `inventory-implementation.md` | Rà soát và báo cáo |

## 3. File chỉnh sửa trong tác vụ này

- Backend: `src/main.py`, `src/models/__init__.py`, `src/models/ly_do_model.py`, `src/repositories/ton_kho_repository.py`, `src/routes/ton_kho_routes.py`, `src/routes/import_routes.py`, `src/routes/ly_do_routes.py`, `src/schemas/ton_kho_schema.py`, `src/schemas/ly_do_schema.py`, `src/services/ton_kho_service.py`, `src/services/don_mua_service.py`, `src/services/nhu_cau_nguyen_lieu_service.py`, `src/services/data_processing/import_service.py`.
- Frontend: `src/pages/ton-kho/TonKhoNguyenLieuPage.tsx`, `src/services/tonKhoService.ts`, `src/services/reasonService.ts`, `src/services/bomExcelService.ts` (chỉ export helper tải file để tái sử dụng), `tests/purchase.spec.ts` (fixture quyền hiện hành và assertion tồn kho mới).
- Các file BOM/nhu cầu/trang khác vốn đã thay đổi trước tác vụ được giữ nguyên; riêng nhu cầu và import routes được bổ sung vào nội dung đang có. Không thay thuật toán Prophet, sidebar, thiết kế chung hoặc cơ chế RBAC.

## 4. API

Tiền tố `/api/ton-kho-nguyen-lieu`:

| Method/path | Chức năng |
|---|---|
| `GET ?latest_only=true` | Tái sử dụng danh sách snapshot mới nhất |
| `GET /{material}` và `GET /{material}/{date}` | Giữ API đọc snapshot cũ; không coi snapshot là giao dịch |
| `POST /`, `PUT /{material}/{date}` | Tái sử dụng ghi nhận/điều chỉnh, thêm lý do và lịch sử; chỉ cập nhật snapshot mới nhất |
| `GET /{material}/chi-tiet` | Tồn kho, hàng đang về, nguồn giữ, giao dịch thực, đơn mua liên quan |
| `GET /excel/template` | Template `.xlsx` và sheet hướng dẫn/lý do |
| `POST /excel/preview` | Kiểm tra toàn file, trả preview và lỗi từng dòng |
| `POST /excel/import` | Multipart file + `confirmed=true`, kiểm tra lại và ghi nguyên file trong transaction |
| `GET /excel/export` | Xuất toàn bộ theo `search`, `muc_ton`, `ngay_ghi_nhan` |
| `GET /san-xuat/ke-hoach` | Kế hoạch hiện có và lượng giữ/xuất |
| `POST /san-xuat/{plan}/giu` | Xác nhận giữ đầy đủ theo BOM |
| `POST /san-xuat/{plan}/xuat` | Số thực xuất từng nguyên liệu, `request_id` chống lặp |
| `POST /san-xuat/{plan}/huy` | Giải phóng phần chưa xuất |

`PATCH /api/don-mua-nguyen-lieu/{order}/nhan-hang` vẫn dùng API nhận hàng hiện có. `POST /api/imports/ton-kho-nguyen-lieu` được chuyển sang cùng importer mới, bắt buộc quyền và xác nhận; template snapshot cũ có book không còn được chấp nhận. Handler import trực tiếp snapshot cũ từ chối thao tác để tránh bỏ qua sổ kho.

## 5. Cập nhật tồn và lịch sử

- Nhận hàng: khóa đơn DA_DUYET, kiểm tra đủ dòng/thực nhận, khóa từng nguyên liệu theo thứ tự mã, cộng **thực nhận**, ghi giao dịch và chốt DA_NHAN_HANG trong cùng transaction. Gửi lại trả 409, không cộng lần hai. Giữ nghiệp vụ nhận một lần: thiếu hàng vẫn đóng đơn; phần thiếu không còn là hàng đang về.
- Giữ: người có quyền xác nhận rõ ràng trên kế hoạch CHO_SAN_XUAT; dùng sản phẩm, số lượng và BOM hiện có. Kiểm tra đủ khả dụng cho tất cả nguyên liệu; thiếu một nguyên liệu thì rollback toàn bộ. Lưu mã kế hoạch/BOM, lượng giữ ban đầu và lượng đã xuất.
- Xuất: trừ thực tế và giảm book cùng số thực xuất. Có thể xuất nhiều đợt trong phần đã giữ; phải gửi đủ các nguyên liệu (0 cho dòng chưa xuất). Không xuất quá thực tế/giữ còn lại. `request_id` lặp với cùng nội dung trả kết quả đã ghi nhận; nội dung khác trả 409.
- Hủy giữ: giải phóng phần chưa xuất, giữ lịch sử phần đã xuất. Lặp lại không giải phóng lần hai. Đây là bước thực thi kho tối thiểu; không thêm module quản trị sản xuất hay tự thay trạng thái sản xuất thành hoàn tất.
- Điều chỉnh: yêu cầu lý do còn hoạt động và áp dụng `DIEU_CHINH_TON_KHO`; “Khác” bắt buộc ghi chú. Không cho sửa book trực tiếp; không giảm tồn xuống dưới lượng đã giữ. Không sửa snapshot cũ. Tạo snapshot mới chuyển tiếp book hiện tại.
- Sổ `giao_dich_ton_kho` lưu thời gian, ngày thực tế, loại, chênh lệch, tồn trước/sau, giữ trước/sau, tham chiếu, người thực hiện, lý do và ghi chú. Kiểm kê thủ công trên bản ghi hiện tại lấy ngày thao tác; tạo snapshot/import dùng ngày kiểm kê được nhập. Giữ/hủy giữ có chênh lệch thực tế bằng 0 và thay đổi book. Không sinh lịch sử từ snapshot cũ.
- Số book cũ được giữ nguyên; popup tách tổng giữ chưa có nguồn khỏi các khoản giữ mới theo kế hoạch. Tồn âm được hiển thị nguyên giá trị, không clamp về 0.
- Trigger ngăn sửa sản phẩm/số lượng của kế hoạch đã có nguồn giữ; ngăn đổi trạng thái sản xuất khi còn giữ chưa xử lý. Không sửa đơn bán hàng để tự trừ kho.

## 6. Đơn vị và đồng bộ nhu cầu

Tồn kho/template/import/export dùng đơn vị trong danh mục nguyên liệu. BOM tính khối lượng theo kg; sản xuất quy đổi rõ ràng giữa kg/g, từ chối đơn vị chưa có quy tắc. Số giữ được làm tròn lên tới độ chính xác tồn kho để tránh giữ thiếu.

Luồng mua hiện có lưu số đề xuất kg và giá VND/kg; đối với nguyên liệu có đơn vị kho g, nhận hàng quy đổi kg sang g. Chi tiết đơn mua vẫn hiển thị kg; popup kho quy đổi số đặt/thực nhận/đang về về đơn vị kho. Nhu cầu đọc tồn/an toàn/tối đa mới nhất và đổi g sang kg; hàng đang về của đơn mua đã là kg. Không sửa dự báo/đề xuất đã duyệt/đơn mua đã chốt. Khi tính lại, dữ liệu tồn mới được sử dụng.

## 7. Excel và UI

- Header giữ thứ tự Tải template → Nhập Excel → Xuất Excel → + Ghi nhận tồn kho; dùng nút/icon/ngôn ngữ thiết kế hiện tại.
- Template đúng 7 cột theo yêu cầu, không có khả dụng/book. Mã/tồn/ngày/lý do bắt buộc; an toàn/tối đa để trống sẽ dùng cấu hình hiện tại, nguyên liệu chưa có tồn phải nhập đủ. Số theo đơn vị danh mục.
- File tối đa 10 MB, 10.000 dòng, chỉ `.xlsx`; kiểm tra sheet/header, mã, số lượng, độ chính xác, giới hạn tồn, ngày, lý do, công thức Excel và trùng mã. Có lỗi không ghi bất kỳ dòng nào. Xem trước không ghi dữ liệu; xác nhận kiểm tra lại trong transaction.
- Export đủ 10 cột, toàn bộ kết quả bộ lọc, không phân trang; tên `Ton_kho_nguyen_lieu_YYYYMMDD.xlsx`. Chuỗi được ghi dạng text để không trở thành công thức Excel. Ngày cập nhật lấy giao dịch mới nhất, fallback ngày snapshot cũ khi chưa có giao dịch.
- Bảng 6 cột; 3 thẻ số nguyên liệu, cần bổ sung, đủ tồn. Cảnh báo âm riêng. Các thông tin book/tối đa/ngày/hàng về nằm trong chi tiết. Popup có 3 tab, nguồn giữ và cảnh báo cần đối soát. Nút lịch sử audit cũ được giữ.
- Nút Nguyên liệu cho sản xuất đặt trong toolbar, không thêm sidebar/module mới. Kiểm kê vẫn có nút hiện tại và trường lý do/ghi chú; book chỉ đọc.

## 8. RBAC

Không hard-code vai trò, không cấp quyền tự động theo vai trò.

| Thao tác | Quyền động |
|---|---|
| Danh sách/chi tiết/lịch sử | `ton_kho_nguyen_lieu/XEM` |
| Ghi nhận đầu kỳ | `ton_kho_nguyen_lieu/THEM` |
| Tạo snapshot ngày mới cho nguyên liệu đã có tồn | Cả `THEM` và `SUA`, tránh lách quyền điều chỉnh |
| Điều chỉnh/giữ/xuất/hủy giữ | `ton_kho_nguyen_lieu/SUA` |
| Tải template | `ton_kho_nguyen_lieu/NHAP_FILE` |
| Preview/import | Cả `NHAP_FILE` và `SUA` |
| Export | `ton_kho_nguyen_lieu/XUAT_EXCEL` |
| Nhận đơn mua | Quyền `don_mua_nguyen_lieu/XAC_NHAN` hiện có |

Hệ thống hiện tại không có quyền lịch sử riêng trong catalog động; dùng XEM, không tạo quyền legacy `TON_KHO_HISTORY_VIEW` giả. Quản lý lý do được mở rộng thêm chức năng điều chỉnh kho.

## 9. Kiểm thử

- PostgreSQL/API: **24/24 qua**, tạo schema riêng trong transaction, rollback cả schema sau mỗi test. Kiểm tra nâng cấp lặp, nhận đúng 90, chưa duyệt/lặp/rollback nhận hàng, giữ/xuất/hủy, nhiều nguyên liệu rollback, tồn âm, đầu kỳ/snapshot cũ, kiểm kê/lý do, Excel hợp lệ/lỗi/trùng, export 25 dòng, quyền 403 và đường import cũ, nhu cầu sau nhập/xuất/giải phóng, quy đổi g/kg.
- Regression backend: **28/28 BOM + 7/7 nhu cầu qua**.
- Trình duyệt: **5/5 tồn kho qua**; **17/17 BOM qua** trong lần chạy regression ban đầu. API được mock ở browser tests; nghiệp vụ được kiểm tra bằng PostgreSQL riêng bên trên.
- Frontend TypeScript/Vite build qua. Còn các cảnh báo dependency `use client`, import tĩnh/động và bundle lớn vốn thuộc cấu hình hiện tại.
- Discovery toàn bộ `reason_tests` có 2 lỗi khởi tạo ở `test_reason_settings.py`/`test_activity_audit.py`: fixture cũ import `get_authorization` không còn có trong dependency RBAC hiện tại. Không khôi phục RBAC cũ chỉ để làm test qua.
- Regression mua hàng bổ sung: **7/8 kịch bản qua** sau khi sửa fixture quyền và locator cũ: xuyên suốt dự báo → nhu cầu → đề xuất → duyệt → đơn mua → nhận hàng → tồn kho → hiệu suất → dashboard; quyền chỉ xem; ADMIN không quyền không có bypass; nhận vượt/nhận 0/lý do nhận thiếu; từ chối đề xuất; kiểm kê/chi tiết tồn; lỗi API/401. Kịch bản còn lỗi là tràn ngang màn hình nhỏ ở **trang Nguyên liệu**, ngoài trang tồn kho; không sửa layout module đó. Kịch bản mobile riêng của tồn kho đã qua.
- Tổng kiểm thử được xác nhận qua ở các lần chạy cuối tương ứng: **59 backend** (24 tồn kho/API + 28 BOM + 7 nhu cầu), **29 browser** (5 tồn kho + 17 BOM + 7 mua hàng). Không coi toàn bộ regression là xanh do các lỗi đã liệt kê.

Lệnh tái hiện (chạy trong thư mục tương ứng):

```powershell
# backend: schema test riêng trong transaction, không thay schema nghiệp vụ
$env:DB_HOST = '127.0.0.1'
$env:INVENTORY_TEST_POSTGRES = '1'
python -m unittest discover -s reason_tests -p test_inventory.py -v
python -m unittest discover -s reason_tests -p 'test_bom*.py' -v
python -m unittest discover -s reason_tests -p test_material_demand.py -v

# frontend
npm run build
npx playwright test tests/inventory.spec.ts tests/bom-excel.spec.ts tests/bom-quantities.spec.ts tests/bom-edit-status.spec.ts
npx playwright test tests/purchase.spec.ts --grep 'forecast → demand|receipt validates|proposal rejection|stock bounds|custom read permission|ADMIN without|API error offers|small viewport'
```

## 10. Triển khai và giới hạn

- Có thể áp migration SQL lên database đúng môi trường. Startup hiện tại cũng đăng ký model mới qua `create_all` và nâng cấp danh mục lý do/trigger sau bước seed lý do cũ. Migration không reset/drop DB, không xóa tồn kho/đơn mua, không backfill lịch sử.
- Chưa restart/deploy dịch vụ hoặc áp migration lên schema nghiệp vụ trong phiên này. Không dùng `docker compose down -v`.
- Đối soát chỉ đọc sau khi kết thúc test vẫn thấy bảng tồn kho/kế hoạch trống và chưa có các bảng sổ kho mới trong schema nghiệp vụ, khớp lần kiểm tra đầu.
- Chưa thể đối soát số book thực tế của Excelsa/Arabica vì database cục bộ trống. Chạy `python scripts/audit_inventory.py` trong đúng môi trường chứa dữ liệu để thu số liệu; không tự sửa các số này.
- Chỉ xác nhận giữ theo BOM một lần cho một kế hoạch; sau hủy giữ không tự tạo lại nguồn giữ. Có thể xuất nhiều đợt trước khi hủy. Không thêm nghiệp vụ xuất vượt giữ, thay BOM của phần đã giữ, hoàn nguyên nguyên liệu đã xuất, hay trạng thái phê duyệt sản xuất mới.
- Kiểm thử chống gửi lặp đã chạy; chưa chạy tải nhiều request đồng thời trên database nghiệp vụ. Khóa dòng và mã yêu cầu được áp dụng ở transaction backend.
