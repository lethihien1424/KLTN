# Nhật ký hoạt động

## Cài đặt

Áp dụng `database/init/migrations/20261012_activity_audit.sql` trước khi chạy backend mới.
Migration mở rộng bảng `nhat_ky_hoat_dong`, tạo index phục vụ bộ lọc và giữ lại các bản ghi cũ.
Migration có thể chạy lại; không sửa bảng dữ liệu nghiệp vụ.

Màn hình: `#/cau-hinh/nhat-ky`. Card và API đọc đều yêu cầu `VIEW_AUDIT_LOG`.
Nút **Lịch sử thay đổi** tại từng bản ghi mở lịch sử ngay trong module, dùng quyền xem
của module tương ứng hoặc `VIEW_AUDIT_LOG`. API theo đối tượng là
`GET /api/nhat-ky-hoat-dong/doi-tuong/{entity}/{code}`; backend cố định phạm vi chức năng
và mã đối tượng, không cho phép bộ lọc mở rộng sang đối tượng hay module khác.
Đơn mua, đề xuất và công thức hiển thị cả thay đổi của các bản ghi chi tiết trực thuộc.
API `GET /api/nhat-ky-hoat-dong` hỗ trợ `search`, `module`, `hanh_dong`,
`nguoi_thao_tac`, `tu_ngay`, `den_ngay`, `page`, `page_size` (tối đa 100).
Khoảng ngày dùng giờ Việt Nam, bao gồm toàn bộ ngày kết thúc. Danh sách xếp mới nhất trước.

## Cách ghi

`activity_audit.py` theo dõi các thay đổi ORM trong Session của API. Người thao tác
được gắn từ tài khoản backend đã xác thực, không đọc từ body, query hay header do frontend tự khai báo.
Trước khi flush, lấy và khóa bản ghi hiện tại; sau khi flush, ghi snapshot và nhật ký
bằng cùng connection/giao dịch nghiệp vụ. Rollback loại bỏ cả thay đổi và log thành công.
Một thao tác ảnh hưởng nhiều bản ghi có thể tạo nhiều log, gồm cả các bản ghi chi tiết và tồn kho.
Mã đối tượng của bản ghi chi tiết chứa mã đối tượng cha để tìm kiếm theo đơn mua/công thức/đề xuất.

Các bảng được theo dõi: nguyên liệu, công thức và chi tiết, tồn kho nguyên liệu,
nhà cung cấp, nguyên liệu cung ứng, đề xuất và chi tiết, đơn mua và chi tiết.
Các API nhập dữ liệu của những bảng này cũng ghi snapshot từng dòng.
Luồng duyệt/từ chối được phân loại vào module Duyệt kế hoạch mua hàng.
Chỉ những giá trị thực sự khác nhau được lưu trong dữ liệu trước/sau; bỏ qua timestamp cập nhật tự động.
Không theo dõi bảng tài khoản, mật khẩu hoặc token; các trường nhạy cảm được loại khỏi snapshot.

Không ghi log cho thao tác thất bại, tìm kiếm, lọc, phân trang hoặc xem chi tiết.
Đăng nhập và đăng xuất không ghi nhật ký. Màn hình tổng hợp chỉ lấy những bản ghi
nghiệp vụ thành công của bốn module, loại cả log đăng nhập/đăng xuất và thất bại đã có từ trước.
Các snapshot lý do cũ vẫn được giữ. Bản ghi cũ không có dữ liệu trước/sau đầy đủ
không được tự dựng thêm dữ liệu lịch sử.

Không có API sửa/xóa nhật ký. Tính năng này theo dõi API hiện có; không thêm thao tác
nghiệp vụ chưa có API (ví dụ chỉnh sửa đề xuất).
Nếu sau này thêm bảng nghiệp vụ hoặc chuyển sang bulk SQL thay vì ORM,
cần bổ sung phạm vi ghi log và kiểm thử tương ứng.

## Kiểm thử

Từ `backend`, chạy `python scripts/run_reason_postgres_tests.py`.
Script tạo database tạm chỉ sao chép schema, áp dụng migration hai lần,
chạy kiểm thử API, rồi xóa đúng database tạm do script tạo.
Fingerprint dữ liệu nguồn được kiểm tra trước/sau.

Kiểm thử bao gồm thêm/sửa nguyên liệu, thao tác không đổi giá trị, giả mạo người thao tác,
nhà cung cấp và trạng thái khôi phục, sửa số lượng đơn mua, nhận hàng,
duyệt/từ chối đơn mua và đề xuất, tạo đơn mua từ đề xuất, tồn kho, nguyên liệu cung ứng,
import, rollback, API thất bại, bộ lọc, phân trang và kiểm tra quyền.
Kiểm thử frontend nằm trong `frontend/tests/purchase.spec.ts`.
