# Màn hình Lịch sử nhập nguyên liệu

## Kết quả

Mua hàng → Lịch sử nhập nguyên liệu, URL `/#/lich-su-nhap-nguyen-lieu`. Mỗi dòng là một phiếu nhận, gồm mã/ngày/NCC/đơn mua/số nguyên liệu/tổng chấp nhận riêng từng đơn vị/trạng thái/thao tác xem chi tiết. Một đơn nhận nhiều đợt có nhiều dòng phiếu độc lập. Trạng thái chốt và đúng/trễ hạn là của đợt được lưu, không suy ra rằng riêng đợt cuối đã giao đủ toàn bộ đơn.

Tìm theo mã phiếu, mã đơn thật/cũ, mã/tên NCC hoặc nguyên liệu; lọc ngày nhận từ/đến bao gồm cả hai mốc, NCC, nguyên liệu, mã đơn thật/cũ chính xác. Bộ lọc nguyên liệu chọn các phiếu có nguyên liệu đó và vẫn giữ toàn bộ dòng/tổng của phiếu. Danh sách phân trang phía giao diện; bộ lọc Excel chạy phía server trên toàn bộ dữ liệu.

Chi tiết hiển thị ngày dự kiến/thực nhận, người xác nhận, ghi chú, từng nguyên liệu và số đặt/giao/chấp nhận, kết quả chất lượng nếu có, lý do, tồn trước/sau từ giao dịch kho được liên kết. Số đặt là số của đơn; số giao/nhận là của riêng đợt. Đơn vị nhận có thể là kg trong khi đơn vị tồn kho là g; hiển thị riêng để không hiểu sai. Có liên kết đến đơn mua, nguồn Hiệu suất NCC và Gợi ý NCC theo quyền tương ứng.

## Bảng và dịch vụ tái sử dụng

- `phieu_nhan_nguyen_lieu`: nguồn, mã phiếu, đơn thật/cũ, đợt, NCC, ngày, người xác nhận, ghi chú.
- `chi_tiet_phieu_nhan_nguyen_lieu`: nguyên liệu, đơn vị nhận, lượng đặt/giao/kiểm định/chấp nhận, lý do, FK giao dịch kho.
- `giao_dich_ton_kho`: đọc tồn trước/sau qua `ma_giao_dich_kho`, không suy diễn từ tồn hiện tại.
- `nguyen_lieu`, `nha_cung_cap`, `users`: tên, đơn vị tồn kho và người xác nhận.
- Giữ nguyên `DeliveryService.receive`, `DonMuaService.receive` và transaction nhập kho. Không thêm bảng, migration hay phiếu bù cho đơn cũ không có chứng từ; GET/export chỉ đọc.

## API

Tái sử dụng:

- GET `/api/giao-nguyen-lieu/lich-su/excel/template`.
- POST `/api/giao-nguyen-lieu/lich-su/excel/preview` và `/import`: import lịch sử nguồn `LICH_SU`, xác nhận riêng, khóa NCC và kiểm tra lại chống trùng trước khi lưu.
- GET `/api/don-mua-nguyen-lieu/{code}/lich-su-nhan-hang`: lịch sử trong chi tiết đơn mua cũ giữ nguyên.
- GET `/api/nha-cung-cap/{code}/hieu-suat-chi-tiet`: popup truy vết KPI hiện có.
- Luồng tính điểm và Gợi ý NCC hiện có tiếp tục sử dụng cùng điểm được cập nhật.

Bổ sung API chỉ đọc:

- GET `/api/giao-nguyen-lieu/lich-su`: tất cả phiếu, chi tiết và tổng từng đơn vị.
- GET `/api/giao-nguyen-lieu/lich-su/phieu/{code}`: một phiếu hoặc 404.
- GET `/api/giao-nguyen-lieu/lich-su/excel/export`: `.xlsx` toàn bộ dòng nguyên liệu của các phiếu phù hợp bộ lọc; không giới hạn một trang.
- List/export nhận `search`, `ngay_nhan_tu`, `ngay_nhan_den`, `ma_ncc`, `ma_nguyen_lieu`, `ma_don_mua`. Ngày sai/thứ tự ngược trả 422; tìm kiếm escape `%`/`_` thành ký tự thường.

## Excel và RBAC

Header: Tải template → Nhập Excel → Xuất Excel, dùng nút/icon và drawer hiện có của Milano/BOM.

- Xem menu/list/detail: `don_mua_nguyen_lieu:XEM`.
- Template: `don_mua_nguyen_lieu:NHAP_FILE` như API đang hoạt động.
- Preview/import: `don_mua_nguyen_lieu:NHAP_FILE` và `nha_cung_cap:TINH_DIEM` vì import cập nhật điểm NCC. Không hard-code vai trò hoặc tự cấp quyền.
- Export: đồng thời `don_mua_nguyen_lieu:XEM` và `don_mua_nguyen_lieu:XUAT_EXCEL`.
- Tùy chọn lọc NCC/nguyên liệu lấy từ phiếu đã được quyền xem, không yêu cầu quyền đọc danh mục khác.

Giữ format 15 cột/sheet `LichSuGiaoHang`. Preview kiểm tra lỗi từng dòng, chống trùng NCC/đơn cũ/đợt và trùng nguyên liệu, kiểm tra ngày/lượng/lũy kế/chốt đơn; import xác nhận riêng và toàn file một transaction. Dữ liệu quá khứ được đánh dấu rõ ở danh sách/chi tiết/export, không gọi API nhận hàng, không cộng tồn, không tạo giao dịch kho, không tạo đơn mua thật. Export là báo cáo chi tiết có tồn trước/sau, không phải file để import lại.

## Chất lượng và KPI

Chỉ thay kiểm tra dữ liệu đầu vào của Import lịch sử: nếu không có kết quả kiểm định, cho phép để trống **cả** `so_luong_dat_chat_luong` và `so_luong_khong_dat`, lưu NULL. Nếu nhập thì bắt buộc cả hai, không âm, tổng bằng số giao và số chấp nhận không vượt số đạt. Số chấp nhận luôn không vượt số giao. Không thay schema hay validator của API nhận hàng hiện tại.

Thuật toán KPI/trọng số/xếp hạng giữ nguyên:

- Đúng hạn: cần ngày hẹn và ngày nhận cuối của đơn chốt; không có hàng giao không được coi là đúng hạn. Đơn mở chưa là mẫu chốt.
- Giao đủ: lượng đặt và lũy kế chấp nhận của từng nguyên liệu; một đơn nhiều phiếu vẫn được gộp thành một đơn.
- Chất lượng: chỉ lấy dòng có kiểm định đạt/không đạt. Dòng chưa kiểm định không tham gia tử/mẫu, không mặc định chấp nhận = đạt. Chưa có mẫu thì KPI chất lượng thực tế là NULL; thuật toán điểm cũ vẫn fallback cấu hình và popup Hiệu suất chỉ rõ nguồn cấu hình.
- Lead time: cần ngày đặt và ngày nhận cuối của đơn chốt có giao thực tế.
- Import tiếp tục tính lại điểm NCC trong transaction hiện có. Gợi ý NCC đọc điểm này và giữ nguyên thứ tự xếp hạng hiện tại.

Dữ liệu còn thiếu: đơn cũ không có phiếu không đủ dựng lại từng đợt; lịch sử import không có tồn trước/sau; client cũ có thể không có kiểm định chất lượng. Không tạo dữ liệu giả để lấp các phần này. Đơn vị tồn kho lấy từ danh mục nguyên liệu vì giao dịch kho cũ không lưu snapshot đơn vị; đổi đơn vị danh mục về sau cần quy trình riêng.

Kiểm tra chỉ đọc tại PostgreSQL cục bộ (`127.0.0.1`) thấy bảng đơn mua nhưng chưa có hai bảng phiếu nhận và `giao_dich_ton_kho`. Đây không phải bằng chứng về dữ liệu DB ứng dụng Docker đã nêu trong tài liệu đợt trước; chưa xác minh được số phiếu/mẫu KPI thực tế trên DB đó. Không chạy migration/reset hoặc ghi dữ liệu lên DB cục bộ để phục vụ việc kiểm tra. Các kiểm thử bên dưới chạy trên schema tạm trong transaction rollback.

## File thay đổi trong đợt này

Tạo:

- `backend/src/services/delivery_history_service.py`.
- `backend/reason_tests/test_delivery_history.py`.
- `backend/docs/material-receipt-history.md`.
- `frontend/src/pages/don-mua/LichSuNhapNguyenLieuPage.tsx`.
- `frontend/tests/delivery-history.spec.ts`.

Sửa:

- `backend/src/routes/delivery_routes.py`: list/detail/export + quyền động.
- `backend/src/services/delivery_excel_service.py`: cho phép thiếu kiểm định, giữ NULL và bổ sung hướng dẫn template; giữ transaction import riêng.
- `frontend/src/services/deliveryService.ts`: kiểu dữ liệu/API list/detail/export.
- `frontend/src/pages/nha-cung-cap/useDeliveryExcel.tsx`: tái sử dụng preview/import, thêm chế độ ba nút cho trang lịch sử; giữ hai nút hiện có ở Hiệu suất NCC.
- `frontend/src/routes/menu.ts`, `frontend/src/routes/AppRoutes.tsx`: menu nhóm Mua hàng, bảo vệ quyền XEM.

Không chỉnh màn hình/nút Excel Nguyên liệu cung ứng, thuật toán KPI/Gợi ý NCC, transaction nhận hàng, database hoặc `.env`.

## Kiểm thử

- Build TypeScript/Vite thành công. Còn warning có sẵn về `use client`/chunk của thư viện và các import tĩnh/động.
- PostgreSQL: 9 ca lịch sử mới + 18 nhận hàng + 27 tồn kho + 15 Excel nguyên liệu cung ứng, tổng 69 ca đạt.
- Lịch sử mới kiểm tra nhiều đợt, tổng từng đơn vị, đầy đủ dòng khi lọc, date/search, tồn trước/sau và g/kg, import thiếu kiểm định, duplicate, không cộng kho, RBAC động, xác nhận import, export hơn một trang, chuỗi Excel không thành công thức, điểm NCC được dùng trong gợi ý, không tạo phiếu giả cho đơn cũ.
- Trình duyệt: 7 ca màn hình lịch sử mới đạt sau khi sửa bộ chọn kiểm thử theo thành phần dùng chung; 3 ca nhận hàng, 12 ca tồn kho, 5 ca Excel nguyên liệu cung ứng cũng đạt. Tổng 27 ca đạt. Xác minh tìm/lọc, nhiều đợt cùng đơn, tổng theo đơn vị, chi tiết, template, export 12 phiếu vượt trang 10 dòng, truyền đầy đủ bộ lọc, import lỗi/chống trùng/xác nhận, nhãn quá khứ và không gọi API nhận hàng, quyền động và giao diện di động.
