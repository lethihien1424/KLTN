# Hàng đang về trên tồn kho nguyên liệu

- Danh sách: Nguyên liệu → Tồn thực tế → Hàng đang về → Tồn khả dụng → Mức an toàn → Tình trạng → Thao tác. Nghiệp vụ giữ nguyên liệu cho sản xuất vẫn hoạt động nên giữ Tồn khả dụng; không cộng hàng đang về vào tồn thực tế hoặc tồn khả dụng.
- `hang_dang_ve` chỉ là dữ liệu đọc từ đơn mua có trạng thái `DA_DUYET`: tổng phần dương của số đặt trừ số thực nhận trên từng dòng. Tính theo đơn vị tồn kho (đơn mua kg được đổi sang g nếu nguyên liệu quản lý bằng g).
- Các đơn chưa duyệt, từ chối và đã đóng không được tính. Mô hình hiện chưa có trạng thái/hành động hủy đơn; bộ lọc chỉ nhận `DA_DUYET` cũng loại mọi trạng thái hủy nếu được bổ sung sau này.
- Hệ thống hiện đã hỗ trợ nhận nhiều đợt. Số thực nhận là lũy kế số chấp nhận nhập kho, không phải tổng số hàng giao hoặc số đạt chất lượng. Luồng nhận cập nhật đơn, tồn kho, phiếu nhận và lịch sử nhập trong cùng giao dịch; yêu cầu lặp có request_id không nhập kho hai lần.
- Nhận một phần giữ đơn mở; nhận đủ tự đóng. Chọn hoàn tất khi nhận thiếu cũng đóng đơn và loại phần còn thiếu khỏi hàng đang về. Không mở rộng nghiệp vụ nhận hàng trong thay đổi này.
- Danh sách và popup dùng chung phép tính theo trạng thái hiện tại. Trường này trên lịch sử snapshot cũng là lượng đang chờ hiện tại, không phải số liệu hồi tố tại ngày snapshot. Tải lại màn hình hoặc bấm Làm mới sau khi nhận hàng để đọc số liệu đã xác nhận.
- Giữ nguyên template, luồng Import/Export Excel và các nghiệp vụ kiểm kê/giữ/xuất hiện có; không có ô nhập tay hàng đang về.
