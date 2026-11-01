# Giải thích gợi ý NCC và khôi phục sau merge

## Phạm vi thay đổi

Gợi ý NCC có nút Cách xếp hạng để so sánh cùng bộ dữ liệu và Xem cách tính trên từng dòng. Drawer tái sử dụng bốn thẻ KPI và chứng từ của Preview, mặc định thu gọn chứng từ. Chỉ mở phiếu, cấu hình hoặc tính lại điểm khi có quyền tương ứng.

Backend trả trọng số, phép tính bằng đầu vào thật, điểm thành phần, thứ hạng, lý do so sánh và thời điểm tính. Frontend không triển khai lại công thức. GET `goi-y-nha-cung-cap/{mapping_id}/giai-thich` dùng quyền XEM hiện có, không lưu điểm, tạo token xác nhận hay ghi đề xuất.

`ranking_parts` tách nguyên phép tính hiện hành: điểm giá từ giá dương thấp nhất, phần giá 30%, phần Điểm NCC × độ đầy đủ KPI 70%. Thứ tự nhóm xác nhận → điểm ưu tiên đã làm tròn → giá → số ngày → mã NCC giữ nguyên. Xác nhận đủ không cộng điểm số. Không lấy tồn Milano hoặc tồn NCC khai báo làm xác nhận.

Điểm NCC dùng lịch sử toàn NCC qua `DeliveryKpiService`, kết hợp thời gian khai báo của từng mapping rồi trung bình các mapping hợp lệ. Drawer chọn đúng mapping đang xem; có phép tính tổng hợp toàn NCC. Không thay nguồn KPI thành lịch sử riêng nguyên liệu vì sẽ đổi thuật toán.

Mapping hiện không lưu riêng đơn vị giá hoặc thời điểm cập nhật. API trả null, giao diện nêu rõ chưa lưu. Đơn vị nguyên liệu và tiền tệ được hiển thị riêng; giá cấu hình là giá tham khảo. Giá mua thực tế truy vết từ lịch sử nhập/đơn mua.

Rà soát hồi quy phát hiện ReasonsPage còn dùng alias quyền đổi trạng thái cũ đã bị thay khi merge. Màn hình được nối đúng `quan_ly_ly_do:XAC_NHAN` như endpoint backend; không sửa danh mục quyền hoặc cấp thêm quyền. Kiểm thử cấu hình dùng đúng quyền này và kiểm tra nút đổi trạng thái bị ẩn khi thu hồi.

## Chọn NCC

Không chọn mặc định. Nút Chọn NCC/Bỏ chọn cho phép tối đa một NCC, chọn NCC khác thay lựa chọn cũ. Đổi nguyên liệu, số lượng, tìm kiếm mới hoặc lưu xác nhận xóa lựa chọn. Refresh kiểm tra lại khả năng chọn; không tự chọn hạng một. Chọn không phát sinh POST.

Luồng từ bảng vẫn cần chọn NCC trước khi chuyển sang tạo đề xuất như trước; không thêm ràng buộc bắt buộc NCC vào những luồng khác. Truyền nguyên liệu, số lượng, NCC, lần dự báo và trạng thái chưa xác nhận. NCC chưa xác nhận có cảnh báo; giữ bước xác nhận rủi ro, lý do và quyền phê duyệt hiện có.

## Khôi phục và vận hành

Các chức năng Preview và xác nhận cung ứng đã nằm trong `stash@{0}` trước merge, chưa có trong hai merge parent. Khôi phục bằng kết hợp ba phiên bản với main sau merge; giữ Dashboard, App/auth, DataTable và routing hiện có. Không áp dụng phần env, script triển khai hoặc xóa các test đang có từ stash. Cả ba stash được giữ nguyên.

Kiểm tra read-only trên DB cấu hình của container: schema xác nhận cung ứng đã có; constraint/lý do áp dụng TINH_LAI_DIEM_NCC chưa có. Hai migration có trong source. Chưa chạy migration, seed lý do hoặc triển khai container trong lần thay đổi này. Tài liệu Preview/cung ứng được phục hồi từ stash có mô tả kiểm thử và triển khai ở thời điểm trước merge; không phải bằng chứng triển khai lại hiện tại.

## Kiểm thử không ghi DB

- Frontend: `npm run build`.
- Backend: `python -m unittest discover -s tests -p test_supplier_ranking_explanation.py -v`, cùng `test_dashboard_merge.py` và `test_forecast_demand_detail.py`; toàn bộ mock, không chạy startup seed.
- UI: `npx playwright test tests/supplier-ranking.spec.ts tests/supplier-score-preview.spec.ts tests/dashboard-merge.spec.ts tests/layout-scroll.spec.ts`.
- Xác nhận cung ứng: `npx playwright test tests/purchase.spec.ts --grep "supply confirmation"`.

Các UI test dùng API giả lập. Không xác nhận ghi điểm, đề xuất hoặc cung ứng vào database thật để kiểm thử.
