# Định lượng nguyên liệu theo BOM cho 1 sản phẩm

## Nguồn khối lượng và phạm vi dữ liệu

- Tái sử dụng `san_pham.khoi_luong` (`Numeric(10,3)`) và `san_pham.don_vi_do_luong`. Schema sản phẩm hiện lưu kg; giao diện sản phẩm nhập g rồi chuyển sang kg. Bộ quy đổi cũng chấp nhận dữ liệu có đơn vị g rõ ràng.
- Không đọc khối lượng từ tên sản phẩm; không mặc định 250g, 1kg hoặc tự đoán đơn vị. Khối lượng thiếu, không dương hoặc đơn vị ngoài kg/g sẽ báo lỗi.
- Không thêm cột database, không migration, không cập nhật dữ liệu cũ. Các trường response `san_pham`, `dinh_luong`, `loi_dinh_luong` là thông tin trả về từ API, không phải dữ liệu mới được lưu.
- Khối lượng nhập trong popup Thêm/Sửa là **thử tính**, có nhãn và thông báo rõ ràng; không gửi trong POST/PUT BOM. Để thay đổi khối lượng chuẩn cần sửa sản phẩm qua chức năng hiện có. Chi tiết BOM và Nhu cầu nguyên liệu luôn dùng khối lượng chuẩn từ danh mục.
- Không thay đổi Prophet, RBAC, lịch sử dự báo, tồn kho hoặc các đơn mua. Chỉ thao tác Lưu BOM của người dùng mới gửi POST/PUT BOM. Mở popup, sửa các ô thử tính và đóng popup không ghi dữ liệu.

## Công thức và kiểm tra

Với `m` là khối lượng thành phẩm chuẩn, `h` là hệ số thu hồi (0–1), `rᵢ` là tỷ lệ nguyên liệu (0–1):

```text
m_kg = m_g / 1000             (nếu nguồn lưu g)
m_kg = san_pham.khoi_luong    (nếu nguồn lưu kg)
đầu_vào_kg = m_kg / h
nguyên_liệu_i_kg = đầu_vào_kg × rᵢ
hao_hụt_kg = đầu_vào_kg − m_kg
nhu_cầu_i_kg = số_sản_phẩm_dự_báo × nguyên_liệu_i_kg
```

- `0 < h <= 1`, mỗi tỷ lệ phối trộn `0 < rᵢ <= 1`, tổng tỷ lệ bằng 1; không cho trùng nguyên liệu.
- Quy tắc nhất quán: `h + tỷ_lệ_hao_hụt = 1`. Khi người dùng thay hệ số thu hồi hợp lệ, form cập nhật hao hụt tương ứng. Nếu tự nhập hao hụt không nhất quán, form và API từ chối dữ liệu.
- Không nhân thêm `(1 + tỷ_lệ_hao_hụt)` hoặc chia thêm cho hao hụt.
- BOM cũ không hợp lệ vẫn đọc được và hiển thị cảnh báo, không tự sửa. API Nhu cầu nguyên liệu trả lỗi nghiệp vụ 422 nếu BOM không đủ điều kiện để quy đổi.
- Backend dùng Decimal, độ chính xác 40 chữ số khi quy đổi. Popup làm tròn 6 chữ số thập phân để hiển thị. Nhu cầu nguyên liệu giữ định dạng kết quả 2 chữ số thập phân, không dùng số đã làm tròn trong popup để nhân dự báo.
- Giữ nguyên phép tính thiếu hàng, tồn an toàn, hàng đang về và giới hạn mua theo tồn tối đa; chỉ sửa phần quy đổi số sản phẩm sang kg.

## API

- `GET /api/cong-thuc/san-pham/{ma_san_pham}/dinh-luong`: đọc mã, tên, khối lượng và đơn vị sản phẩm để phục vụ popup Thêm; dùng quyền xem BOM hiện có.
- `GET /api/cong-thuc/{ma_cong_thuc}`: bổ sung thông tin sản phẩm và định lượng cho 1 sản phẩm. Dữ liệu cũ không hợp lệ trả `dinh_luong: null` và `loi_dinh_luong`.
- `GET /api/nhu-cau-nguyen-lieu/{ma_lich_su_du_bao}`: dùng chung `QuyDoiBomService.per_product` với chi tiết BOM, sau đó nhân số sản phẩm dự báo.
- POST/PUT BOM giữ nguyên cấu trúc ghi, bổ sung kiểm tra hao hụt và khối lượng tham chiếu.

## File thay đổi trong yêu cầu này

| File | Nội dung |
| --- | --- |
| `backend/src/services/quy_doi_bom_service.py` | Chuẩn hóa kg, kiểm tra BOM và quy đổi chung cho 1 sản phẩm/dự báo |
| `backend/src/services/nhu_cau_nguyen_lieu_service.py` | Lấy thông tin khối lượng sản phẩm và truyền vào bộ quy đổi |
| `backend/src/repositories/nhu_cau_nguyen_lieu_repository.py` | Truy vấn khối lượng sản phẩm theo danh sách mã |
| `backend/src/services/cong_thuc_service.py` | Bổ sung dữ liệu định lượng trong chi tiết và kiểm tra khối lượng khi lưu |
| `backend/src/controllers/cong_thuc_controller.py` | Đọc thông tin sản phẩm phục vụ popup |
| `backend/src/routes/cong_thuc_routes.py` | Route đọc thông tin khối lượng dùng quyền BOM hiện có |
| `backend/src/schemas/cong_thuc_schema.py` | Response định lượng và kiểm tra thu hồi/hao hụt nhất quán |
| `frontend/src/pages/cong-thuc/CongThucPage.tsx` | Tích hợp khối định lượng vào Thêm/Sửa/Chi tiết, kiểm tra form |
| `frontend/src/pages/cong-thuc/BomQuantification.tsx` | Khối định lượng cập nhật tức thì và trường khối lượng thử tính |
| `frontend/src/services/bomQuantities.ts` | Hàm tính/kiểm tra phía giao diện |
| `frontend/src/services/congThucService.ts` | Kiểu dữ liệu và API thông tin khối lượng sản phẩm |
| `frontend/src/services/purchaseTypes.ts` | Kiểu response BOM mở rộng |
| `backend/reason_tests/test_bom_quantities.py` | Test quy đổi, kiểm tra schema và đối chiếu hai HTTP API |
| `backend/reason_tests/test_material_demand.py` | Bổ sung khối lượng/hụt trong fixture, giữ các test tồn kho hiện có |
| `frontend/tests/bom-quantities.spec.ts` | Test popup Thêm/Sửa/Chi tiết và bảo toàn dữ liệu thử tính |
| `test-fixtures/bom_quantities.json` | Dữ liệu mẫu và kết quả mong đợi dùng chung backend/frontend |
| `backend/docs/bom_dinh_luong.md` | Báo cáo này |

Các thay đổi sẵn có trong workspace và chức năng Excel nguyên liệu của yêu cầu trước được giữ nguyên.

## Kết quả kiểm thử

Kiểm thử bằng mock repository/HTTP API và fixture; không chạy ghi dữ liệu trên database nghiệp vụ. CT0001 dưới đây là ca kiểm thử, không phải khẳng định dữ liệu CT0001 thực tế đã được sửa.

| Lệnh | Kết quả |
| --- | --- |
| `cd backend` rồi `python -m unittest discover -s reason_tests -p "test_bom_quantities.py" -v` | PASS 7/7 |
| `cd backend` rồi `python -m unittest discover -s reason_tests -p "test_material_demand.py" -v` | PASS 7/7 |
| `cd frontend` rồi `npx playwright test tests/bom-quantities.spec.ts` | PASS 5/5 |
| `cd frontend` rồi `npm run build` | PASS TypeScript và Vite build |

Đã kiểm tra: CT0001; thay hệ số thu hồi; thay tỷ lệ; thay khối lượng; tổng tỷ lệ sai; thu hồi 0/âm/>1; hao hụt không nhất quán; đơn vị/khối lượng thiếu; không đọc số từ tên; hai HTTP API cùng kết quả; popup không ghi khi thử tính/đóng; Lưu BOM không gửi khối lượng thử tính; tồn an toàn/hàng về/giới hạn tồn tối đa vẫn hoạt động.

## Ví dụ CT0001 — Classic 250g

Khối lượng chuẩn `0.250 kg`, thu hồi `0.85`, hao hụt `0.15`, phối trộn Robusta `0.85`, Arabica `0.15`:

| Đại lượng | Kg cho 1 sản phẩm (hiển thị 6 số lẻ) |
| --- | ---: |
| Thành phẩm | 0.250000 |
| Tổng nguyên liệu đầu vào | 0.294118 |
| Robusta | 0.250000 |
| Arabica | 0.044118 |
| Hao hụt | 0.044118 |

Với 1.000 sản phẩm dự báo: Robusta `250.00 kg`, Arabica `44.12 kg` ở API Nhu cầu nguyên liệu. Khối lượng được nhân trước khi làm tròn kết quả.
