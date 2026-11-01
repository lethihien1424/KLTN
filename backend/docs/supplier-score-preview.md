# Preview và xác nhận tính lại điểm NCC

## Chính sách giữ nguyên từ v2

Không đổi thuật toán `supplier_scoring.py` hoặc cách tổng hợp của `DeliveryKpiService`.

- Chất lượng 35%, đúng hạn 30%, giao đủ 20%, đáp ứng thời gian giao 15%.
- Chỉ dùng tiêu chí có bằng chứng; chuẩn hóa theo tổng trọng số có dữ liệu. Thiếu không đồng nghĩa 0%. Không có mapping/KPI: điểm NULL.
- Điểm mapping = 100 × tổng(trọng số × KPI) / tổng trọng số có dữ liệu. Điểm NCC = trung bình điểm mapping, HALF_UP đến 0,01.
- Chất lượng: tính tỷ lệ đạt/giao theo đơn vị rồi lấy trung bình, chỉ dùng dòng có kiểm định. Đúng hạn: đơn đã chốt. Giao đủ: trung bình các tỷ lệ nhập/đặt theo dòng rồi theo đơn, gồm cả đơn đang giao.
- Thời gian: min(1, số ngày khai báo của mapping / số ngày thực tế trung bình của đơn đã chốt có giao hàng). Cùng ngày: 1; thiếu thực tế: NULL. Đây là tiêu chí có cả mốc khai báo và bằng chứng thực tế.
- Giữ nguồn thực tế, lịch sử Excel và đơn đã nhận cũ riêng biệt. Tỷ lệ chất lượng/đúng hạn/giao đủ khai báo và tồn NCC demo không phải KPI thực tế. Không sửa số liệu để đạt điểm mong muốn.

## API và bảo toàn dữ liệu

- `GET /api/nha-cung-cap/{ma_ncc}/tinh-diem/preview` và `GET /api/nha-cung-cap/tinh-diem/preview`: không ghi điểm, không ghi audit, không cấp quyền.
- `POST /api/nha-cung-cap/{ma_ncc}/tinh-diem` và `POST /api/nha-cung-cap/tinh-diem`: bắt buộc body `preview_token`, `ly_do` (1–2000 ký tự sau trim), `ghi_chu` (tùy chọn, tối đa 2000).
- Tất cả endpoint yêu cầu quyền động `nha_cung_cap:TINH_DIEM`, cùng quyền XEM theo chính sách RBAC hiện có. Client không được gửi điểm hoặc người thao tác.
- Token ký HMAC, hạn 15 phút, gắn người thao tác, phạm vi một NCC/tất cả và fingerprint nguồn + điểm hiện tại + chính sách + chi tiết tính. Token không được lưu vào audit.
- Xác nhận khóa bảng nguồn trong transaction ngắn (SHARE ROW EXCLUSIVE; chờ khóa tối đa 5 giây), kiểm tra lại nguồn, rồi lưu. Khóa bao gồm NCC, mapping, đơn/chi tiết đơn, phiếu/chi tiết phiếu; ngăn cả chèn chứng từ mới trong lúc kiểm tra và lưu. Vì phạm vi khóa rộng, batch nên chạy ngoài thời điểm nhận hàng cao điểm nếu dữ liệu lớn.
- Dữ liệu thay đổi, đổi phạm vi/người hoặc token hết hạn: 409; không cập nhật một phần batch. Người dùng phải xem Preview mới và xác nhận lại.
- Audit `TINH_LAI_DIEM_NCC` ghi từng NCC kể cả khi điểm không đổi, gồm điểm trước/sau, chi tiết tiêu chí/trọng số, KPI, fingerprint nguồn, số mẫu, người/thời gian, lý do, ghi chú và batch. Cùng transaction với điểm; lỗi audit rollback cả cập nhật.
- Không migration, không sửa tồn kho, chứng từ nhận hàng, tỷ lệ khai báo hay phân quyền. Luồng tự cập nhật điểm từ nhận hàng/Excel hiện có được giữ nguyên; thay đổi đó khiến Preview đang mở trở nên cũ.
- Màn Nhà cung cấp và thao tác tính điểm tại Hiệu suất dùng chung popup Preview.

## Kiểm thử và triển khai

- API/PostgreSQL: `python -m unittest discover -s tests -p test_supplier_score_preview.py -v` trong backend. Mỗi test tạo schema riêng trong outer transaction rồi rollback; không chạy startup seed, không sửa public.
- Frontend: `npm run build`; `npx playwright test tests/supplier-score-preview.spec.ts tests/delivery-history.spec.ts`.
- Dữ liệu thực: chạy trong môi trường backend đang phục vụ ứng dụng (container Compose, không tự chuyển host `postgres` sang một PostgreSQL localhost khác): `python -m scripts.verify_supplier_score_preview snapshot --report /tmp/score-live-before.json`, sau triển khai chạy `verify` cùng report. Hai lệnh chỉ đọc; so fingerprint mọi bảng public và đối soát tổng điểm với đóng góp tiêu chí. Không xác nhận điểm thật trong quá trình kiểm thử.
- Triển khai code backend/frontend cùng lúc vì POST tính điểm nay bắt buộc token Preview và lý do. Không tự động tính lại điểm thật khi triển khai.

## Kết quả kiểm tra ngày 01/11/2026

- 16 kiểm thử PostgreSQL/API đạt; có kiểm thử rollback điểm và audit khi lỗi giữa batch, kiểm tra dữ liệu nguồn đổi dù điểm tổng không đổi, quyền động, token hết hạn và phạm vi/người thực hiện.
- Build frontend thành công; 25 kiểm thử Playwright đạt (5 luồng Preview và 20 luồng lịch sử nhập/Excel).
- Cập nhật 3 tệp backend và 4 tệp frontend liên quan vào các container đang chạy; bản code trước lưu ở `/tmp/supplier-score-before` trong từng container. Khởi động lại backend, healthcheck healthy; các module frontend trả HTTP 200. Không rebuild hoặc thay image; lần tạo lại container cần build từ workspace hiện tại.
- API đang chạy có hai route Preview; POST bắt buộc body xác nhận; GET Preview không đăng nhập trả 401.
- Đối soát read-only trong chính container backend: 5 NCC, 38 bảng public không thay đổi. NCC0001: 57,67; NCC0002: 97,80; NCC0003: 83,09; NCC0004: 76,91; NCC0005: NULL, chưa đủ dữ liệu. Đây là kết quả tại thời điểm kiểm tra, không hard-code trong ứng dụng.
- Bằng chứng: `reports/supplier-score-preview/docker-live-before.json` và `docker-live-after.json` ở gốc workspace. Xác nhận lưu điểm/audit được thử trên schema cô lập; không thực hiện xác nhận ghi điểm trên dữ liệu thật.

## Các tệp của thay đổi này

- Backend: `src/services/supplier_score_preview_service.py`, `src/routes/nha_cung_cap_routes.py`, `src/schemas/nha_cung_cap_schema.py`.
- Kiểm tra backend: `tests/test_supplier_score_preview.py`, `scripts/verify_supplier_score_preview.py`.
- Frontend: `src/pages/nha-cung-cap/SupplierScorePreviewDialog.tsx`, `NhaCungCapPage.tsx`, `HieuSuatNhaCungCapPage.tsx`, `src/services/nhaCungCapService.ts`.
- Kiểm tra frontend: `tests/supplier-score-preview.spec.ts`.
- Tài liệu: file này. Không commit/push Git.
## Giải thích và truy vết số liệu

Riêng Chất lượng, `giai_thich.tong_hop_kiem_dinh` trả tổng giao/đạt/không đạt
và số dòng hợp lệ theo từng đơn vị đo, cùng phép chia và chuỗi dữ liệu do
backend định dạng. Tổng giao/đạt tái sử dụng nhóm đơn vị đang tính KPI; không
đưa dòng thiếu kiểm định vào tổng. Các đơn vị có tổng giao 0 vẫn được giải
thích nhưng không tham gia trung bình. Số dòng hợp lệ dùng điều kiện có kiểm
định và lượng giao > 0 như số mẫu Preview hiện có.

Popup đặt tổng hợp → phép tính KPI → điểm đóng góp trước mục “Xem chi tiết
chứng từ” mặc định đóng. Bộ chọn chất lượng chỉ chứa dòng chứng từ (tổng hợp
đơn vị hiển thị ở khối trên); nhãn tỷ lệ riêng của chứng từ phân biệt rõ với
KPI toàn NCC. Đổi chứng từ không thay đổi tổng hợp hoặc đóng góp.

Kiểm tra riêng phần hiển thị này: `python -m unittest discover -s tests -p
test_quality_score_explanation.py -v` chạy thuần, không kết nối database;
Playwright dùng API giả lập để kiểm tra thứ tự và tính độc lập khi đổi phiếu.

Preview bổ sung `giai_thich_tong` cho phép tính trung bình điểm mapping và
`mapping[].tieu_chi[].giai_thich` (`tom_tat`, `ghi_chu`, `dong`) cùng `phep_tinh`
cho phép tính đóng góp sau chuẩn hóa trọng số. Mỗi dòng giải thích có mã đơn,
nguồn (`THUC_TE`, `LICH_SU`, `DON_CU`) và mã phiếu nhận nội bộ/mã PN để truy vết.
Frontend chỉ trình bày các phép tính do backend trả về; không tính lại KPI.

`cong_thuc_ngan` là công thức mặc định; `tom_tat` chứa phép tính tổng hợp
với các số thực tế khi mở rộng. Mapping trả thêm `giai_thich_tong` cho tổng
đóng góp và công thức chuẩn hóa trọng số.

`DeliveryKpiService.summarize` giữ nguyên thuật toán và bổ sung bằng chứng ngay
tại các nhóm dữ liệu đang tính: từng dòng kiểm định (kể cả chưa kiểm định),
tỷ lệ giao đủ chính xác trước khi làm tròn, phiếu thuộc từng đơn, thời gian thực
tế theo đơn và cờ có giao hàng. Chất lượng lấy tổng đạt/tổng giao trong từng
đơn vị rồi trung bình các đơn vị có tổng giao dương. Giao đủ trung bình từng
nguyên liệu trong đơn rồi trung bình đơn. Đúng hạn đếm theo đơn đã chốt.
Lead time so sánh khai báo của mapping với trung bình ngày thực tế của các
đơn đã chốt có giao hàng; 0 ngày vẫn nhận KPI 100% như trước.

Các KPI thực tế hiện dùng chung dữ liệu toàn NCC cho mọi mapping; lead time
khai báo là riêng từng mapping. Điểm NCC lấy trung bình điểm các mapping hợp
lệ và làm tròn HALF_UP 0,01. Tiêu chí thiếu dữ liệu không nhận điểm 0 và không
tham gia mẫu số trọng số. Các phép tính giải thích hiển thị tối đa 6 chữ số
thập phân; tính điểm vẫn dùng Decimal gốc, không cộng các số hiển thị đã làm tròn.

Popup hiển thị điểm hiện tại → điểm tính lại, số nguyên liệu hợp lệ và phép
tính trung bình. Danh sách nguyên liệu cho chọn một mapping, chỉ hiển thị một
bộ bốn card KPI. Mỗi card mở rộng theo ba bước: nguồn thực tế, KPI, đóng góp.
Danh sách chứng từ mặc định đóng và bộ chọn chỉ hiển thị một chứng từ/nhóm
tổng hợp tại một thời điểm. Chính sách và phép cộng mapping được thu gọn.
Header/footer dùng FormDrawer hiện có. Nút xem phiếu
tái sử dụng ReceiptDetail; liên kết đơn, lịch sử và cung ứng chỉ hiện khi có
quyền xem tương ứng; API chứng từ vẫn kiểm tra RBAC như trước.

## Lý do từ cấu hình

Danh sách chức năng quản lý lý do bổ sung `TINH_LAI_DIEM_NCC`. Popup dùng
`GET /api/ly-do/ap-dung?chuc_nang=TINH_LAI_DIEM_NCC`; endpoint dùng đúng quyền
`nha_cung_cap:TINH_DIEM` hiện có cho nghiệp vụ này, không cấp thêm quyền cho
người dùng. Lý do hết hiệu lực/không thuộc nghiệp vụ bị chặn khi xác nhận.
“Khác” yêu cầu ghi chú. Audit tiếp tục ghi tên lý do trong trường `ly_do`
hiện có, lấy tên từ DB khi gửi `ly_do_id`. POST giữ tương thích với client cũ
gửi `ly_do`; popup mới luôn gửi cả mã và tên lý do đã chọn.

Khi triển khai, chạy migration
`database/migrations/20261101_supplier_score_reasons.sql` để mở rộng CHECK
constraint phạm vi lý do. Migration không tạo lý do mẫu, không sửa điểm,
phiếu nhận, phân quyền hay dữ liệu lịch sử. Sau đó người có quyền quản lý
lý do cấu hình lý do đang sử dụng cho nghiệp vụ mới. Nếu chưa có lý do phù
hợp, popup hiển thị hướng dẫn và vô hiệu hóa xác nhận; Preview vẫn xem được.

Kiểm tra bản thiết kế lại: 24 kiểm thử PostgreSQL/API và 10 kiểm thử Playwright
đạt; build frontend và TypeScript đạt. Có kiểm thử tổng 57,67 từ hai mapping,
chuyển nguyên liệu không lặp card, chọn một chứng từ tại một thời điểm, lý do
“Khác”, thiếu lý do, RBAC, Preview cũ và header/footer cố định trên mobile.
Migration lý do chỉ được chạy trong schema kiểm thử cô lập rồi rollback;
chưa áp dụng vào database thật.

