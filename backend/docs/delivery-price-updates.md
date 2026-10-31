# Cập nhật giá Excel cho phiếu nhập đã tồn tại

Chức năng đã được triển khai vào backend/frontend Docker. Không cần migration mới: dùng `don_gia_mua NUMERIC(15,2)`, `don_vi_don_gia VARCHAR(20)` và `thanh_tien NUMERIC(30,4)` generated stored đã có. Không thay đổi Import lịch sử giao hàng mới.

## Sử dụng

Mở **Mua hàng → Lịch sử nhập nguyên liệu → Cập nhật giá từ Excel**. Có thể chọn file đang có hoặc tải template theo bộ lọc. Preview hiển thị mã phiếu/nguyên liệu, số chấp nhận đang lưu, giá/đơn vị giá cũ và mới, thành tiền cũ và mới. Nhập lý do rồi bấm **Xác nhận cập nhật giá**. Nếu dữ liệu đã đổi, phải xem và xác nhận Preview mới.

Ba nút Tải template → Nhập Excel → Xuất Excel của luồng lịch sử mới được giữ nguyên; nút cập nhật giá nằm sau ba nút này. Không dùng nút Nhập Excel lịch sử mới cho file CapNhatGia.

## Template và tương thích file người dùng

Sheet **CapNhatGia**, template chính thức v1 gồm 5 cột theo thứ tự:

| Cột | Quy tắc |
|---|---|
| ma_phieu_nhan | Mã phiếu tồn tại, tối đa 32 ký tự |
| ma_nguyen_lieu | Mã nguyên liệu thuộc đúng phiếu, tối đa 20 ký tự |
| don_gia_mua | Decimal hữu hạn không âm, tối đa 15 chữ số/2 số lẻ, bắt buộc |
| don_vi_don_gia | Đơn vị mua đúng theo dòng phiếu, ví dụ kg hoặc VND/kg |
| ly_do | Lý do riêng dòng, có thể để trống; vẫn phải nhập lý do chung khi xác nhận |

Template tải từ UI điền sẵn mã, giá hiện có nếu có và đơn vị; không tự lấy giá từ danh mục cung ứng. Có 7 dòng tương ứng 4 phiếu thật trong template đã tải tại `reports/delivery-price-updates/live/Template_cap_nhat_gia_phieu_nhap.xlsx`. Giá hiện tại vẫn trống.

Hỗ trợ nguyên file `Cap_nhat_don_gia_7_phieu_nhap_cu.xlsx` có 12 tiêu đề tiếng Việt. Ánh xạ mã phiếu cột A + mã nguyên liệu E; giá I, đơn vị giá J. Đối chiếu thông tin đơn cũ/đợt/NCC/số lượng/đơn vị với database. Cột K là thành tiền tham khảo, không đọc cache hoặc chạy công thức; hệ thống luôn tự tính từ số chấp nhận trong database. Ghi chú L được giữ trong audit, không ghi đè ghi chú của phiếu và không thay lý do xác nhận.

File gốc được tìm thấy trong Downloads và được sao chép nguyên trạng vào `test-fixtures/Cap_nhat_don_gia_7_phieu_nhap_cu.xlsx` để chạy test. File ghi rõ giá 78.000/92.000/118.000 chỉ là **GIÁ MINH HỌA, không phải chứng từ thực tế**. UI hiển thị cảnh báo khi có ghi chú này. Chưa áp dụng giá minh họa lên database thật; chỉ thực hiện Preview thật và cập nhật trong schema test rollback/API mock. Cần nhập giá có bằng chứng thực tế rồi xác nhận trên UI.

## API, RBAC và transaction

Cùng prefix `/api/giao-nguyen-lieu/lich-su/excel/prices`:

- `GET /template`: tải mẫu theo các bộ lọc lịch sử hiện có.
- `POST /preview`: multipart `file`, trả report và `preview_token`.
- `POST /apply`: multipart `file`, `confirmed=true`, `preview_token`, `reason`.

Cả ba route yêu cầu đồng thời quyền động `don_mua_nguyen_lieu:XEM`, `NHAP_FILE`, `SUA`. Không kiểm tra vai trò cố định, không bypass ADMIN, không tự cấp quyền, không cần quyền tính điểm NCC. Import lịch sử mới vẫn dùng bộ quyền cũ.

Validation gồm bản ghi tồn tại, cặp phiếu/nguyên liệu không trùng, giá/đơn vị hợp lệ, file không hỏng, giới hạn 10 MB/10.000 dòng thật. Ô trống chỉ có định dạng không làm tăng vùng dữ liệu. Công thức/ô lỗi trong đầu vào bị từ chối; ngoại lệ duy nhất là cột K hiển thị của mẫu 12 cột, vì không bao giờ được dùng làm dữ liệu ghi.

Giá cuối cùng phải thống nhất theo NCC/đơn cũ/nguyên liệu giữa các đợt có giá; khi sửa giá khác giá cũ cần chọn đủ đợt liên quan. Phiếu nhận thực tế chỉ bổ sung được giá khớp chi tiết đơn mua snapshot; không thay đổi giá đơn mua đã duyệt.

Apply khóa NCC theo thứ tự của luồng nhận/import, sau đó khóa chi tiết phiếu theo id, kiểm tra lại toàn bộ file và so sánh token HMAC gắn với file cùng giá/đơn vị/số lượng đang lưu. Token sai, file đổi, Preview cũ hoặc gửi lặp sau thành công trả 409. File sai nghiệp vụ trả 422 trước khi ghi. Preview/Apply không có quyền trả 401/403. Giá 0 hợp lệ, ô trống không xóa giá. Xác nhận lại cùng giá bằng Preview mới là no-op, không sinh nhật ký trùng.

Chỉ gán giá và đơn vị giá; PostgreSQL tự tính thành tiền. Không sửa số lượng, ngày, kiểm định, header/trạng thái, ghi chú phiếu, đơn mua, kho hoặc KPI.

Mỗi dòng thay đổi tạo một bản ghi `nhat_ky_hoat_dong`, hành động `CAP_NHAT_GIA_NHAP`, có batch id, mã phiếu/nguyên liệu, giá/đơn vị/thành tiền trước và sau, người cập nhật lấy từ tài khoản đã xác thực, lý do chung/riêng, tên file và ghi chú nguồn. Giá và audit nằm trong cùng transaction. Lỗi audit hoặc ghi dữ liệu rollback toàn bộ. Có thể xem từ màn hình nhật ký hoạt động với quyền xem nhật ký hiện có.

## Kết quả kiểm thử và triển khai

- **94/94 backend PASS**, 0 failure/error/skip. Gồm 80 regression hiện có và 14 test cập nhật giá: file thật 7 dòng/4 phiếu, audit 7 dòng, transaction rollback, lỗi cuối file, lỗi audit, token/Preview cũ, trùng/mã sai, giá/đơn vị sai, file cũ tách biệt, nhất quán giữa các đợt, giá 0, quyền động.
- **12/12 Playwright PASS**: 9 test lịch sử hiện có + 3 test cập nhật giá. Upload nguyên file 7 dòng vào API mock, xác nhận có lý do, Chi tiết/Export hiển thị đúng giá mới. Lỗi invalid/stale không tự ghi lại, quyền SUA/NHAP_FILE được kiểm tra.
- Frontend `npm run build`: PASS. Chỉ còn các cảnh báo thư viện/chunk hiện có.
- **14 kiểm tra HTTP thật PASS** sau triển khai: template 5 cột/7 dòng; Preview nguyên file trả 200, valid=true, 7 dòng/4 phiếu, không lỗi; Apply chưa xác nhận trả 422; thiếu token 401, thiếu quyền 403; danh sách và cả 4 chi tiết, Export 7 dòng, template lịch sử mới đều 200.
- Đã xác nhận đúng database/cluster, pg_dump custom và kiểm tra pg_restore --list trước khi chỉ rebuild/recreate backend/frontend bằng `--no-deps`. Không thay container PostgreSQL, không chạy migration mới.
- Fingerprint tất cả bảng public trước/sau test, triển khai và HTTP không đổi. Vẫn 4 phiếu, 7 chi tiết; giá thật chưa cập nhật, kho và kiểm kê Excelsa không thay đổi. Không reset, tạo phiếu thử trong public, commit hoặc push.

Bằng chứng: `reports/delivery-price-updates/backend-tests.txt`, `verification.json`, `deployment/verification.json` kèm backup, `live/verification.json`, `live/preview.json` và template chính thức. Các test cập nhật thành công dùng schema riêng có outer transaction rollback hoặc API mock, không phải cập nhật thành công trên public.

File triển khai: `backend/src/services/delivery_price_update_service.py`, thêm 3 route trong `delivery_routes.py`, `frontend/src/pages/don-mua/useReceiptPriceExcel.tsx`, tích hợp trong `LichSuNhapNguyenLieuPage.tsx`, thêm kiểu/API trong `deliveryService.ts`. Test: `test_delivery_price_update.py`, mở rộng `delivery-history.spec.ts`, runner cô lập và hai fixture. Script triển khai/HTTP nằm trong `backend/scripts`.
