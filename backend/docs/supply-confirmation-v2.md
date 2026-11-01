# Gợi ý NCC: xác nhận cung ứng và điểm thực tế – 01/11/2026

## Kết quả triển khai

- Bỏ cột Khả dụng (kg) khỏi Gợi ý NCC; đổi Lead time thành Thời gian giao dự kiến.
- Ba trạng thái: `CHUA_XAC_NHAN`, `DA_XAC_NHAN_DU`, `DA_XAC_NHAN_KHONG_DU`.
- Dữ liệu tồn/book/xuất cũ không phải bằng chứng xác nhận và được giữ nguyên.
- Mỗi lần lưu tạo một bản xác nhận mới; không sửa/xóa lịch sử. API dùng người đăng nhập, không nhận người xác nhận từ client.
- Xác nhận tách theo mapping NCC/nguyên liệu và mã dự báo (hoặc phạm vi không gắn dự báo).
- Thông tin: lượng yêu cầu, lượng xác nhận, ngày xác nhận, hạn hiệu lực, người, nguồn, lý do, ghi chú.
- Nguồn cho phép: Email, điện thoại, văn bản/báo giá, trao đổi trực tiếp. Chỉ người có quyền ghi nhận sau khi liên hệ NCC/nhận chứng từ.
- API kiểm tra thời gian bằng đồng hồ PostgreSQL; ngày xác nhận không ở tương lai, hạn mới phải còn hiệu lực. Hết hạn trở về Chưa xác nhận.
- Thay đổi lượng cần mua gọi lại đánh giá và xóa lựa chọn cũ. Frontend kiểm tra hạn mỗi giây, làm mới mỗi 30 giây và khi cửa sổ nhận focus.
- Kiểm soát phiên bản: hai người cùng cập nhật từ một bản cũ sẽ có một người nhận 409, cần tải lại. Đóng popup tải lại dữ liệu.

## Quy trình mua hàng

Luồng: Nhu cầu → Gợi ý NCC → Đề xuất → Đơn mua → Nhận hàng.

- Truyền và lưu mã dự báo, nguyên liệu, lượng mua; đơn mua và phiếu nhận truy vết tiếp qua quan hệ đề xuất/đơn mua sẵn có.
- Khi tạo đề xuất có mã dự báo, tính lại nhu cầu theo quy tắc BOM/tồn kho hiện tại; từ chối lượng vượt nhu cầu mới (409). Không chạy Prophet.
- Đã xác nhận đủ: cho lập đề xuất Chờ duyệt, lưu ID xác nhận và trạng thái tại lúc lập.
- Đã xác nhận không đủ: không cho chọn/lập đề xuất với lượng đó.
- Chưa xác nhận: người lập phải tự tích xác nhận đã biết rủi ro và ghi lý do. Chỉ tạo Chờ duyệt, không tự duyệt.
- Đề xuất mới không được duyệt hoặc sinh đơn nếu chưa có xác nhận còn hạn và đủ lượng. Kiểm tra lại ở backend tại từng bước; không tin trạng thái client.
- Khóa mapping/nguyên liệu theo thứ tự ổn định, trừ lượng đã phân bổ cho các đề xuất khác trong cùng phạm vi. Không cho hai đề xuất đồng thời chiếm cùng một lượng xác nhận.
- Cập nhật bằng chứng không xóa lượng đang phân bổ cho các đề xuất chờ xử lý. Từ chối đề xuất giải phóng phân bổ.
- Một xác nhận đã dùng cho đơn nhận xong không tự trở thành cam kết cho đơn mới. Bằng chứng mới cần được ghi nhận cho đợt tiếp theo; nghĩa vụ đang chờ từ bản trước vẫn được tính.
- Đề xuất có trước migration giữ cờ `yeu_cau_xac_nhan=false`, tiếp tục luồng cũ. API tạo đề xuất mới luôn đặt true; client không được tự đặt cờ để bỏ qua.
- Lý do và mã dự báo hiển thị trong chi tiết đề xuất. Phê duyệt vẫn cần các quyền cũ.

## Công thức điểm v2

Không dùng tồn NCC, book, lượng xuất hoặc ba tỷ lệ chất lượng/đúng hạn/giao đủ khai báo để tính điểm.

| KPI có bằng chứng giao nhận | Trọng số |
|---|---:|
| Chất lượng thực tế Q | 35% |
| Đúng hạn thực tế O | 30% |
| Giao đủ thực tế F | 20% |
| Đáp ứng thời gian giao L | 15% |

Q/O/F lấy từ `DeliveryKpiService` hiện có; tỷ lệ được giới hạn 0..1. Không sửa cách tổng hợp chứng từ/KPI nhận hàng.

`L = min(1, thời gian giao dự kiến của mapping / thời gian giao thực tế trung bình)`.
Nếu nhận cùng ngày (thực tế = 0 ngày), L = 1. Nếu chưa có thời gian thực tế thì L thiếu dữ liệu, không tự cho 100 điểm.

Với tập KPI hiện có E:

`C = tổng trọng số của E`

`Điểm mapping = 100 × tổng(w × KPI) / C` nếu C > 0; nếu C = 0, điểm là NULL.

`Điểm NCC = trung bình điểm các mapping`, làm tròn HALF_UP đến 0,01.

C là **độ đầy đủ theo trọng số**, không phải chứng nhận độ tin cậy hoặc số lượng mẫu. UI hiển thị C và Chưa có KPI khi không có bằng chứng. Các chỉ tiêu khai báo vẫn giữ ở màn Nguyên liệu cung ứng, không được giả thành KPI thực tế.

Xếp hạng theo nhóm: Đã xác nhận đủ → Chưa xác nhận → Đã xác nhận không đủ.
Trong mỗi nhóm:

`Điểm giá = 100 × giá thấp nhất đang chào cho nguyên liệu / giá NCC`

`Điểm xếp hạng = 30% × Điểm giá + 70% × Điểm NCC × C`

NCC chưa có KPI chỉ nhận phần điểm giá; không gán điểm chất lượng giả. Các điểm bằng nhau xét giá tăng dần, thời gian giao tăng dần, mã NCC. Điểm NCC được tính trực tiếp bằng cùng hàm với chức năng lưu/tính lại điểm, không dùng điểm cũ làm đầu vào.

### Đối soát điểm sau chuyển đổi

| NCC | Trước | V2 |
|---|---:|---:|
| Tây Nguyên NCC0001 | 62,06 | 57,67 |
| NCC0002 | 97,29 | 97,80 |
| Cao Nguyên NCC0003 | 96,17 | Chưa có KPI (NULL) |
| NCC0004 | 98,10 | Chưa có KPI (NULL) |
| NCC0005 | 0 | Chưa có KPI (NULL) |

84,17 là phép tính lại theo công thức cũ với chỉ tiêu khai báo; không tiếp tục dùng làm điểm v2 cho Cao Nguyên khi chưa có bằng chứng giao nhận. Các cập nhật điểm có audit của migration; không sửa chứng từ hoặc KPI đầu vào để đạt một điểm định trước.

## API và RBAC

- `GET /api/goi-y-nha-cung-cap?ma_nguyen_lieu=...&so_luong_can_mua=...&ma_lich_su_du_bao=...`: quyền XEM.
- `POST /api/goi-y-nha-cung-cap/xac-nhan`: quyền **goi_y_nha_cung_cap:XAC_NHAN**.
- `GET /api/goi-y-nha-cung-cap/xac-nhan/{mapping_id}?ma_lich_su_du_bao=...`: 50 bản gần nhất trong phạm vi, quyền XEM.
- POST chấp nhận `phien_ban_truoc` là ID bản đang xem, hoặc null cho bản đầu; người xác nhận lấy từ phiên đăng nhập.
- Quyền mới xuất hiện trong danh mục RBAC. Không tự cấp quyền cho role/admin có sẵn; cần cấp bằng màn Phân quyền nếu muốn hiện thao tác Xác nhận cung ứng.
- `du_kha_nang_cung_cap` còn được trả để tương thích, chỉ true khi thực sự Đã xác nhận đủ. Không trả trường tồn khả dụng NCC trong API gợi ý.

## Migration và bảo toàn dữ liệu

Migration: `database/migrations/20261101_supply_confirmation.sql`.

- Thêm bảng `xac_nhan_cung_ung`, index, khóa ngoại và ràng buộc lượng/ngày.
- Bổ sung mã dự báo, cờ yêu cầu xác nhận, lý do vào đề xuất; ID xác nhận/trạng thái vào chi tiết đề xuất.
- Không xóa cột/dòng dữ liệu cũ. Không thêm xác nhận mẫu. Không tự cấp quyền.
- Script `backend/scripts/deploy_supply_confirmation.py` chụp fingerprint trước, kiểm tra trong transaction, áp dụng DDL và tính lại điểm có audit, kiểm tra sau commit và sau restart.
- Đã áp dụng vào PostgreSQL container Milano và cập nhật backend/frontend Docker.
- 37 bảng có dữ liệu cũ được đối soát: số dòng/checksum của các cột bảo vệ khớp trước/sau, kể cả quyền, tồn kho, mapping, BOM/dự báo, đề xuất/đơn mua, chứng từ và audit cũ. Chỉ các trường điểm/KPI NCC được phép tính lại và audit mới được bổ sung.
- NL0002 vẫn: tồn thực tế 70.080, đã giữ 47, khả dụng 70.033, hàng đang về 0 kg. Mapping NCC giữ nguyên 900/60/150 và 700/50/120.
- Chưa tạo xác nhận thật hoặc giả cho demo (0 bản). Hai NCC của NL0002 trả Chưa xác nhận; điểm live khớp điểm lưu.
- Không đổi Prophet/BOM, tồn kho, dữ liệu Import/Export, không reset DB và không commit/push Git.

Chứng cứ tại thư mục được gitignore `backend/reports/supply-confirmation/`: `before.json`, `after.json`, `after-restart.json`, `live.json`. Ảnh UI: `frontend/reports/supply-confirmation.png`.

## Kiểm thử

- TypeScript `tsc --noEmit`: đạt; `npm run build`: đạt (cảnh báo bundle/import hiện có).
- 16 kiểm thử backend: schema PostgreSQL `test_supply_<uuid>` độc lập, không dùng dữ liệu public. Bao gồm RBAC cấp/thu hồi, actor không giả mạo, nguồn/ngày, hết hạn, đổi lượng, cập nhật phiên bản, audit, chống phân bổ trùng đồng thời, từ chối/giải phóng, không tái sử dụng xác nhận đã giao xong, mã dự báo, nhu cầu thay đổi, đề xuất nhiều dòng, tương thích đề xuất cũ và điểm NULL/nhất quán.
- 3 kiểm thử trình duyệt về xác nhận và luồng đầy đủ: đạt.
- 24 kiểm thử hồi quy Excel cung ứng/Excel đơn mua/lịch sử nhận hàng: đạt.
- 25 kiểm thử hồi quy PostgreSQL hiện có (14 Excel đơn mua, 11 mã phiếu nhận/nhận hàng/giá/RBAC): đạt. Tổng backend: **41 đạt**; frontend: **27 đạt**.
- Kiểm tra runtime: health 200, OpenAPI có route xác nhận, service read-only trả đúng dữ liệu NL0002 và điểm lưu/live khớp.
- `git diff --check`: đạt.

Lệnh kiểm thử PostgreSQL trong backend đã chuẩn bị file migration:

```text
SUPPLY_ISOLATED_PG=1 SUPPLY_MIGRATION=/path/to/20261101_supply_confirmation.sql python -m unittest discover -s tests -p test_supply_confirmation.py -v
```

## Các file triển khai

Backend mới: `src/models/supply_confirmation.py`, `src/schemas/supply_confirmation_schema.py`, `src/services/supply_confirmation_service.py`, `src/services/supplier_scoring.py`, `tests/test_supply_confirmation.py`, `scripts/deploy_supply_confirmation.py`.

Backend cập nhật: `src/models/__init__.py`, `src/models/de_xuat_nhap_hang.py`, `src/models/chi_tiet_de_xuat.py`, `src/repositories/de_xuat_repository.py`, `src/routes/goi_y_nha_cung_cap_routes.py`, `src/schemas/goi_y_nha_cung_cap_schema.py`, `src/schemas/de_xuat_nhap_hang_schema.py`, `src/schemas/nha_cung_cap_schema.py`, `src/services/goi_y_nha_cung_cap_service.py`, `src/services/de_xuat_nhap_hang_service.py`, `src/services/nha_cung_cap_service.py`, `src/services/activity_audit.py`, `src/core/permission_catalog.py`.

Frontend mới: `src/pages/goi-y/SupplyConfirmationDrawer.tsx`.

Frontend cập nhật: `src/pages/goi-y/GoiYNhaCungCapPage.tsx`, `src/pages/de-xuat/TaoDeXuatPage.tsx`, `src/pages/de-xuat/ChiTietDeXuatPage.tsx`, `src/routes/AppRoutes.tsx`, `src/services/deXuatService.ts`, `src/services/purchaseTypes.ts`, `tests/purchase.spec.ts`.

Các thay đổi `.env`, `.env.backup` và tệp không liên quan có sẵn trong workspace không được chỉnh sửa trong công việc này.
