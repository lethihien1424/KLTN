# Rà soát giao hàng trước khi code (29/10/2026)

- Đơn mua/chi tiết đã có API duyệt, nhận hàng một lần, kiểm tra thực nhận và transaction cộng kho; tái sử dụng endpoint nhận hàng và khóa đơn/kho.
- `so_luong_thuc_nhan` hiện là lượng đã nhập kho. Không đổi ý nghĩa trường này; khi nhiều đợt sẽ là tổng lũy kế được chấp nhận.
- Chưa có bảng phiếu nhận/chất lượng. Sổ kho có nguồn đơn mua nhưng chưa có dữ liệu từng lần kiểm chất lượng.
- KPI hiện lấy đơn DA_NHAN_HANG để tính đúng hạn/đủ; chất lượng và lead time vẫn từ mapping cấu hình. Nhận hàng chưa tự tính lại điểm.
- Điểm thương mại hiện dùng trọng số 30% chất lượng, 25% đúng hạn, 20% đủ, 15% lead time, 10% khả dụng NCC. Giữ cấu trúc trọng số, ưu tiên số thực tế khi đủ mẫu; phần cấu hình được ghi nhãn rõ.
- Có thể thêm nhiều đợt mà không thêm trạng thái DB: đơn còn mở giữ DA_DUYET và `ngay_giao_thuc_te` trống; lần chốt chuyển DA_NHAN_HANG. API cũ mặc định chốt một lần để tương thích.
- Database Docker có 3 đơn: 1 chưa duyệt, 1 đã duyệt, 1 từ chối; chưa có đơn đã nhận. Đã kiểm tra constraint đơn mua/chi tiết và migration inventory hiện hành.
- Không có nguồn đáng tin cậy tự đồng bộ tồn NCC. Không tự sửa book/xuất/tồn NCC khi nhận hàng.
- Import lịch sử phải tách nguồn LICH_SU, không liên kết giao dịch kho, không cập nhật đơn mua thật hoặc cộng kho. Mã đơn cũ trùng đơn hiện có bị từ chối.

Phạm vi: phiếu nhận và dòng giao, nhiều đợt có mã chống trùng, KPI có truy vết, tab lịch sử trên chi tiết đơn, import lịch sử riêng có preview/confirm; không thay Prophet/BOM/sidebar.
