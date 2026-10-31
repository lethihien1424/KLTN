# Sửa chẩn đoán preview Excel lịch sử nhận hàng

## Điều kiện gây thông báo cũ

Parser cũ gộp ba điều kiện bằng OR vào một thông báo:

1. `sheet.max_column != 15`.
2. `sheet.max_row > 10001` (10.000 dòng cộng hàng tiêu đề).
3. Danh sách giá trị hàng 1 không bằng chính xác `COLUMNS`.

Thông báo này xuất hiện trước bước kiểm tra kiểu dữ liệu/nghiệp vụ từng dòng. Tên sheet không đúng đã có nhánh lỗi riêng. Không thể khẳng định file người dùng vi phạm điều kiện nào vì chưa nhận được chính file đó trong workspace.

Đã tái hiện lỗi bằng file tạo từ chính hàm template, có 7 dòng hợp lệ và ô **trống chỉ có định dạng** tại P10050. openpyxl trả `max_column=16`, `max_row=10050`; cả điều kiện 1 và 2 của parser cũ đều sai dù dữ liệu thật vẫn chỉ A:O và 7 dòng. Metadata `<dimension>` thiếu, thấp hơn hoặc lớn hơn dữ liệu thật cũng có thể gây đọc sai nếu tin trực tiếp vào nó.

## Cách sửa

- Giữ `load_workbook(BytesIO(...), read_only=True, data_only=False)` để đọc `.xlsx` thật và phát hiện công thức, không lấy giá trị cache để bỏ qua công thức.
- Dùng `reset_dimensions()` rồi đọc các ô thực tế trong worksheet XML. Bỏ qua ô trống chỉ có định dạng, đếm dòng có dữ liệu; không coi metadata vùng đã dùng là số dòng dữ liệu.
- Tên sheet vẫn phải đúng `LichSuGiaoHang`. Nếu thiếu, thông báo liệt kê sheet thực tế.
- Tên/thứ tự 15 cột A:O vẫn phải đúng tuyệt đối; thông báo chỉ ra từng ô tiêu đề, tên cần có và giá trị thực nhận. Không tự trim/đổi tên cột để vượt validation.
- Dữ liệu thật ngoài A:O vẫn bị từ chối, thông báo vị trí như P8. Hàng tiêu đề và dòng trống không tính vào giới hạn 10.000 dòng. Dòng dữ liệu thứ 10.001 vẫn bị chặn và nêu số dòng Excel.
- Tách lỗi đuôi tệp, kích thước 10 MB, ZIP `.xlsx` hỏng, workbook/worksheet không đọc được khỏi lỗi tiêu đề và số dòng.
- Công thức và ô lỗi Excel được chỉ ra bằng tên cột/tọa độ. Dòng có lỗi ô không được tiếp tục dùng để tạo nhóm nhập.
- Lỗi kiểu ngày nêu cột/tọa độ và định dạng cần có; lỗi thứ tự ngày/tương lai tách riêng. Ngày Excel thật hoặc chuỗi ISO vẫn được chấp nhận.
- Lỗi số lượng nêu cột/tọa độ, số âm, sai kiểu, quá số chữ số/số lẻ; lỗi hoàn tất chỉ rõ cột M. Giữ nguyên kiểm tra số đặt/giao/chấp nhận/chất lượng, mã NCC/nguyên liệu, trùng đợt, lũy kế và trạng thái chốt.
- Hợp đồng API giữ nguyên: lỗi cấu trúc HTTP 422 với `detail` dạng chuỗi; lỗi dữ liệu trả report `valid=false`, lỗi từng dòng. Frontend hiện có hiển thị trực tiếp chuỗi này và bảng lỗi dòng, không cần sửa giao diện.

## Xác minh

- Unit test dùng workbook .xlsx thật: 7 dòng từ template, ô trống P10050 có định dạng, dimension thiếu/sai, header sai/thừa cột, công thức, ô lỗi Excel, tên sheet, ZIP hỏng, kích thước, đúng 10.000 và vượt 10.000 dòng.
- Kiểm thử API lấy template bằng GET thật trong TestClient, điền 7 dòng có ngày Excel, boolean và số/số dạng chuỗi; gọi POST preview cho cả bản thường và bản có P10050. Sau đó import xác nhận 7 phiếu lịch sử, kiểm tra chống trùng và so sánh tồn của cả hai nguyên liệu cùng lịch sử kho trước/sau.
- Tất cả test PostgreSQL chạy trong schema riêng và transaction rollback. Không reset DB, không ghi thêm tồn hoặc dữ liệu nghiệp vụ thật.

File sửa: `backend/src/services/delivery_excel_service.py`, `backend/reason_tests/test_delivery_history.py`. File thêm: `backend/reason_tests/test_delivery_excel_parser.py` và tài liệu này.
