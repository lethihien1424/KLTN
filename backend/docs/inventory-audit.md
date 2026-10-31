# Rà soát tồn kho trước triển khai (28/10/2026)

- `ton_kho_nguyen_lieu`: snapshot, khóa chính nguyên liệu/ngày; khả dụng là generated column thực tế trừ book. Không sửa công thức, không chuyển snapshot cũ thành giao dịch.
- CRUD tồn kho đã có nhưng cho sửa book và snapshot cũ, không có lý do nghiệp vụ.
- Nhận hàng `DonMuaService.receive`: đã khóa đơn, chỉ nhận DA_DUYET, kiểm tra đủ dòng, thực nhận <= đặt, commit cùng tồn; nhận một lần, lần lặp trả 409. Tái sử dụng.
- Lịch sử hiện tại là snapshot theo ngày và audit ORM chung; chưa có sổ nhập/xuất nghiệp vụ trước/sau.
- `so_luong_book`: được ghi trực tiếp qua CRUD/import snapshot; chưa tìm thấy liên kết giữ với kế hoạch. Các số book cũ không đủ bằng chứng để gán cho kế hoạch.
- Kế hoạch sản xuất có sản phẩm/số lượng/trạng thái; được tạo từ dữ liệu bán hàng, chưa có API xuất nguyên liệu. Chỉ thêm thực thi kho theo kế hoạch, không xây module sản xuất mới.
- Nhu cầu: lấy snapshot mới nhất, dùng khả dụng và incoming của đơn DA_DUYET. Không sửa Prophet, lịch sử dự báo hay đề xuất đã duyệt.
- RBAC thực tế dùng `(chuc_nang, thao_tac)`; tái sử dụng XEM/THEM/SUA/NHAP_FILE/XUAT_EXCEL. Giữ/xuất/hủy giữ dùng SUA, nhập Excel cần cả NHAP_FILE và SUA vì có thể điều chỉnh.
- Excel BOM đã có openpyxl, preview/confirm, giới hạn file và chống công thức. Tái sử dụng helper file Excel; thay import tồn cũ bằng quy trình có xác nhận.
- Workspace có thay đổi sẵn trong BOM, nhu cầu, bảng chung và trang tồn kho; giữ các thay đổi này.

## Phạm vi bổ sung

Sổ giao dịch bất biến theo thao tác thực tế; bảng giữ theo kế hoạch/nguyên liệu có BOM nguồn; transaction và khóa nguyên liệu theo thứ tự thống nhất; điều chỉnh chỉ snapshot mới nhất, không sửa book thủ công. Snapshot cũ chỉ đọc. Giảm tồn dưới lượng đã giữ bị từ chối; không sửa dữ liệu âm cũ. Kế hoạch được người có quyền SUA xác nhận giữ rõ ràng, chỉ lúc đó mới tăng book. Xuất hỗ trợ nhiều lần trong giới hạn đã giữ; hủy giải phóng phần chưa xuất.

## Kiểm tra database

Mọi truy vấn đối soát dữ liệu thực tế phải chỉ đọc. Migration chỉ thêm bảng và mở rộng danh mục lý do; không backfill giao dịch, không xóa dữ liệu. Kết quả kiểm thử và giới hạn triển khai được ghi trong `inventory-implementation.md`.
