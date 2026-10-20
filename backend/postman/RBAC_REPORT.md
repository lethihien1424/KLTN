# Báo cáo chuyển backend Milano Coffee sang RBAC

Ngày: 04/10/2026.

## Kết quả thực hiện

Backend dùng permission theo thao tác, không quyết định quyền truy cập bằng tên role. Role mới có thể tạo qua API, tích/bỏ quyền và gán cho user mà không sửa endpoint hoặc restart backend. ADMIN được seed quyền trong role_permissions, không có bypass.

Migration RBAC và migration cột liên hệ user có sẵn đã được áp dụng vào **container milano_postgres / database milano_coffee**. Không áp dụng vào PostgreSQL cài trực tiếp trên Windows.

## 1. Schema cuối cùng

- `roles`: ma_vai_tro VARCHAR(50) PK, ten_vai_tro VARCHAR(100), mo_ta TEXT, trang_thai (HOAT_DONG/NGUNG_HOAT_DONG), thoi_gian_tao, thoi_gian_cap_nhat.
- `permissions`: ma_quyen VARCHAR(80) PK, ten_quyen VARCHAR(150), module VARCHAR(50), mo_ta TEXT, thoi_gian_tao.
- `role_permissions`: composite PK (ma_vai_tro, ma_quyen), hai FK tới roles/permissions.
- `users.vai_tro`: giữ nguyên tên/type, bỏ users_vai_tro_check, thêm FK fk_users_vai_tro tới roles.ma_vai_tro. Một role/user.
- `schema_migrations`: đánh dấu migration đã seed; chạy lại không phục hồi quyền đã thu hồi.

## 2. Migration và bảo toàn dữ liệu

Migration mới: `../database/init/migrations/20261004_dynamic_rbac.sql`.

SQL transaction, advisory lock trước DDL/seed, IF NOT EXISTS/ON CONFLICT, seed một lần theo version. Tạo 5 role đang dùng và 4 role legacy không hoạt động. Nếu có role lạ đang được user lịch sử sử dụng, giữ role đó ở NGUNG_HOAT_DONG để FK không phá dữ liệu.

Đã áp dụng cùng `../database/init/03_add_user_contact_fields.sql`: đây là migration có sẵn cho ba cột email, so_dien_thoai, dia_chi mà auth/user model đã sử dụng. Không thiết kế lại auth, không cập nhật các giá trị cũ trong users.

Không chạy lại migration workflow trên database thật; các cột workflow đã tồn tại. Các prerequisite đó chỉ chạy trên database test clone schema.

So sánh count và fingerprint toàn bộ dòng/cột hiện có của **19 bảng** trước/sau trong transaction: **không thay đổi**. users chỉ thêm ba cột liên hệ NULL. Không reset DB, không xóa user/volume/dữ liệu, không kích hoạt KHO01/KHSX01.

Bản sao lưu trước migration: `C:\Users\User\AppData\Local\Temp\milano-rbac-backup-ejr3ikvu\milano_coffee_before_rbac.dump`.

Kết quả kiểm tra được ghi trong `RBAC_VERIFICATION.json`.

| Tài khoản | Role được bảo toàn | Trạng thái |
| --- | --- | --- |
| admin | ADMIN | HOAT_DONG |
| NVBH | NHAN_VIEN_BAN_HANG | HOAT_DONG |
| QLBH | QUAN_LY_BAN_HANG | HOAT_DONG |
| MH01 | NHAN_VIEN_MUA_HANG | HOAT_DONG |
| QLMH | QUAN_LY_MUA_HANG | HOAT_DONG |
| KHO01 | NHAN_VIEN_KHO | NGUNG_HOAT_DONG |
| KHSX01 | NHAN_VIEN_KE_HOACH_SAN_XUAT | NGUNG_HOAT_DONG |

## 3. Permission và cấu hình seed

Các key sau tương ứng API đang tồn tại. Import là batch write riêng nên có permission riêng; không mở import chỉ vì có VIEW. Không tạo API bán hàng CRUD chưa tồn tại.

Lưu ý seed mới theo yêu cầu: QUAN_LY_MUA_HANG không có NHA_CUNG_CAP_SCORE. Hiệu suất NCC dùng endpoint hiện có `/api/dashboard/hieu-suat-nha-cung-cap` với NHA_CUNG_CAP_PERFORMANCE_VIEW, vì nhân viên mua hàng cần xem hiệu suất mà không cần quyền Dashboard. Hai endpoint tổng quan/cảnh báo dùng DASHBOARD_VIEW.

| Role mặc định | Số quyền |
| --- | --- |
| ADMIN (Quản trị viên) | 55 |
| NHAN_VIEN_BAN_HANG (Nhân viên bán hàng) | 3 |
| QUAN_LY_BAN_HANG (Quản lý bán hàng) | 5 |
| NHAN_VIEN_MUA_HANG (Nhân viên mua hàng) | 35 |
| QUAN_LY_MUA_HANG (Quản lý mua hàng) | 17 |

Danh sách đầy đủ (role có quyền ở cấu hình seed ban đầu):

| Key | Tên hiển thị | Role seed |
| --- | --- | --- |
| `CONG_THUC_CHANGE_STATUS` | Đổi trạng thái công thức / BOM | ADMIN, NHAN_VIEN_MUA_HANG |
| `CONG_THUC_CREATE` | Tạo công thức / BOM | ADMIN, NHAN_VIEN_MUA_HANG |
| `CONG_THUC_UPDATE` | Cập nhật công thức / BOM | ADMIN, NHAN_VIEN_MUA_HANG |
| `CONG_THUC_VIEW` | Xem công thức / BOM | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `DASHBOARD_VIEW` | Xem Dashboard | ADMIN, QUAN_LY_MUA_HANG |
| `DE_XUAT_NHAP_HANG_APPROVE` | Duyệt đề xuất nhập hàng | ADMIN, QUAN_LY_MUA_HANG |
| `DE_XUAT_NHAP_HANG_CREATE` | Tạo đề xuất nhập hàng | ADMIN, NHAN_VIEN_MUA_HANG |
| `DE_XUAT_NHAP_HANG_REJECT` | Từ chối đề xuất nhập hàng | ADMIN, QUAN_LY_MUA_HANG |
| `DE_XUAT_NHAP_HANG_VIEW` | Xem đề xuất nhập hàng | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `DON_MUA_APPROVE` | Duyệt đơn mua | ADMIN, QUAN_LY_MUA_HANG |
| `DON_MUA_CREATE` | Tạo đơn mua | ADMIN, NHAN_VIEN_MUA_HANG |
| `DON_MUA_RECEIVE` | Nhận hàng của đơn mua | ADMIN, NHAN_VIEN_MUA_HANG |
| `DON_MUA_REJECT` | Từ chối đơn mua | ADMIN, QUAN_LY_MUA_HANG |
| `DON_MUA_UPDATE` | Cập nhật đơn mua | ADMIN, NHAN_VIEN_MUA_HANG |
| `DON_MUA_VIEW` | Xem đơn mua | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `DU_BAO_RUN` | Chạy dự báo | ADMIN, NHAN_VIEN_BAN_HANG, QUAN_LY_BAN_HANG |
| `DU_BAO_VIEW` | Xem dự báo | ADMIN, NHAN_VIEN_BAN_HANG, QUAN_LY_BAN_HANG, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `GOI_Y_NHA_CUNG_CAP_VIEW` | Xem gợi ý nhà cung cấp | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `IMPORT_CONG_THUC` | Import công thức / BOM | ADMIN, NHAN_VIEN_MUA_HANG |
| `IMPORT_DON_HANG` | Import đơn hàng | ADMIN, NHAN_VIEN_BAN_HANG, QUAN_LY_BAN_HANG |
| `IMPORT_NGAY_LE` | Import ngày lễ | ADMIN, QUAN_LY_BAN_HANG |
| `IMPORT_NGUYEN_LIEU` | Import nguyên liệu | ADMIN, NHAN_VIEN_MUA_HANG |
| `IMPORT_NGUYEN_LIEU_NCC` | Import nguyên liệu theo nhà cung cấp | ADMIN, NHAN_VIEN_MUA_HANG |
| `IMPORT_NHA_CUNG_CAP` | Import nhà cung cấp | ADMIN, NHAN_VIEN_MUA_HANG |
| `IMPORT_SAN_PHAM` | Import sản phẩm | ADMIN, QUAN_LY_BAN_HANG |
| `IMPORT_TON_KHO` | Import tồn kho | ADMIN, NHAN_VIEN_MUA_HANG |
| `NGUYEN_LIEU_CHANGE_STATUS` | Đổi trạng thái nguyên liệu | ADMIN, NHAN_VIEN_MUA_HANG |
| `NGUYEN_LIEU_CREATE` | Tạo nguyên liệu | ADMIN, NHAN_VIEN_MUA_HANG |
| `NGUYEN_LIEU_NCC_CREATE` | Tạo nguyên liệu theo nhà cung cấp | ADMIN, NHAN_VIEN_MUA_HANG |
| `NGUYEN_LIEU_NCC_UPDATE` | Cập nhật nguyên liệu theo nhà cung cấp | ADMIN, NHAN_VIEN_MUA_HANG |
| `NGUYEN_LIEU_NCC_VIEW` | Xem nguyên liệu theo nhà cung cấp | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `NGUYEN_LIEU_UPDATE` | Cập nhật nguyên liệu | ADMIN, NHAN_VIEN_MUA_HANG |
| `NGUYEN_LIEU_VIEW` | Xem nguyên liệu | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `NHA_CUNG_CAP_CHANGE_STATUS` | Đổi trạng thái nhà cung cấp | ADMIN, NHAN_VIEN_MUA_HANG |
| `NHA_CUNG_CAP_CREATE` | Tạo nhà cung cấp | ADMIN, NHAN_VIEN_MUA_HANG |
| `NHA_CUNG_CAP_PERFORMANCE_VIEW` | Xem hiệu suất nhà cung cấp | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `NHA_CUNG_CAP_SCORE` | Tính điểm nhà cung cấp | ADMIN, NHAN_VIEN_MUA_HANG |
| `NHA_CUNG_CAP_UPDATE` | Cập nhật nhà cung cấp | ADMIN, NHAN_VIEN_MUA_HANG |
| `NHA_CUNG_CAP_VIEW` | Xem nhà cung cấp | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `NHU_CAU_NGUYEN_LIEU_VIEW` | Xem nhu cầu nguyên liệu | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `PERMISSION_VIEW` | Xem danh sách quyền | ADMIN |
| `ROLE_ASSIGN_PERMISSION` | Gán quyền cho vai trò | ADMIN |
| `ROLE_CREATE` | Tạo vai trò | ADMIN |
| `ROLE_UPDATE` | Cập nhật vai trò | ADMIN |
| `ROLE_VIEW` | Xem vai trò | ADMIN |
| `TON_KHO_CREATE` | Tạo tồn kho | ADMIN, NHAN_VIEN_MUA_HANG |
| `TON_KHO_HISTORY_VIEW` | Xem lịch sử tồn kho | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `TON_KHO_UPDATE` | Cập nhật tồn kho | ADMIN, NHAN_VIEN_MUA_HANG |
| `TON_KHO_VIEW` | Xem tồn kho | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `USER_ASSIGN_ROLE` | Gán vai trò cho tài khoản | ADMIN |
| `USER_CREATE` | Tạo tài khoản | ADMIN |
| `USER_DELETE` | Xóa tài khoản | ADMIN |
| `USER_IMPORT` | Import tài khoản | ADMIN |
| `USER_UPDATE` | Cập nhật tài khoản | ADMIN |
| `USER_VIEW` | Xem tài khoản | ADMIN |

## 4. Authorization và auth contract

- `src/dependencies/permission_dependency.py`: get_authorization và require_permission(*keys), mặc định yêu cầu đầy đủ các key.
- `src/services/authorization_service.py`: load role/permission từ DB, chặn user/role ngừng hoạt động, check tập permission.
- `src/repositories/rbac_repository.py`: một SELECT join role–role_permissions–permissions để lấy toàn bộ quyền, kể cả role không có grant. Không query từng permission. Dependency được cache trong request, không cache qua request.
- JWT giữ claim role để tương thích nhưng không dùng claim đó quyết định quyền; mỗi request lấy user/role hiện tại từ DB. Role/permission thay đổi có hiệu lực với JWT đang tồn tại.
- Login vẫn check mật khẩu và trạng thái user, thêm check trạng thái role, trả user kèm role/permissions.
- `GET /api/auth/me`: giữ vai_tro dạng string, bổ sung role {ma_vai_tro,ten_vai_tro} và permissions. FE không cần suy ra quyền từ tên role.

Ví dụ contract rút gọn:

```json
{
  "ma_nguoi_dung": "MH01",
  "ho_ten": "Tên người dùng hiện tại",
  "vai_tro": "NHAN_VIEN_MUA_HANG",
  "role": {
    "ma_vai_tro": "NHAN_VIEN_MUA_HANG",
    "ten_vai_tro": "Nhân viên mua hàng"
  },
  "trang_thai": "HOAT_DONG",
  "permissions": ["DON_MUA_VIEW", "DON_MUA_CREATE", "DON_MUA_RECEIVE"]
}
```

permissions trong ví dụ là tập con minh họa. Response thực tế chứa toàn bộ quyền hiện tại, cùng email/so_dien_thoai/dia_chi.

## 5. Endpoint đã chuyển sang permission

**68 tổ hợp method/path** được bảo vệ bằng permission. Import kiểm tra ở service trước khi đọc file.

| Endpoint | Permission bắt buộc |
| --- | --- |
| `GET /api/nguyen-lieu` | `NGUYEN_LIEU_VIEW` |
| `GET /api/nguyen-lieu/{ma_nguyen_lieu}` | `NGUYEN_LIEU_VIEW` |
| `POST /api/nguyen-lieu` | `NGUYEN_LIEU_CREATE` |
| `PUT /api/nguyen-lieu/{ma_nguyen_lieu}` | `NGUYEN_LIEU_UPDATE` |
| `PATCH /api/nguyen-lieu/{ma_nguyen_lieu}/trang-thai` | `NGUYEN_LIEU_CHANGE_STATUS` |
| `GET /api/cong-thuc` | `CONG_THUC_VIEW` |
| `GET /api/cong-thuc/{ma_cong_thuc}` | `CONG_THUC_VIEW` |
| `POST /api/cong-thuc` | `CONG_THUC_CREATE` |
| `PUT /api/cong-thuc/{ma_cong_thuc}` | `CONG_THUC_UPDATE` |
| `PATCH /api/cong-thuc/{ma_cong_thuc}/trang-thai` | `CONG_THUC_CHANGE_STATUS` |
| `GET /api/ton-kho-nguyen-lieu` | `TON_KHO_VIEW` |
| `GET /api/ton-kho-nguyen-lieu/{ma_nguyen_lieu}` | `TON_KHO_HISTORY_VIEW` |
| `GET /api/ton-kho-nguyen-lieu/{ma_nguyen_lieu}/{ngay_ghi_nhan}` | `TON_KHO_VIEW` |
| `POST /api/ton-kho-nguyen-lieu` | `TON_KHO_CREATE` |
| `PUT /api/ton-kho-nguyen-lieu/{ma_nguyen_lieu}/{ngay_ghi_nhan}` | `TON_KHO_UPDATE` |
| `POST /api/nha-cung-cap/tinh-diem` | `NHA_CUNG_CAP_SCORE` |
| `POST /api/nha-cung-cap/{ma_ncc}/tinh-diem` | `NHA_CUNG_CAP_SCORE` |
| `GET /api/nha-cung-cap` | `NHA_CUNG_CAP_VIEW` |
| `GET /api/nha-cung-cap/{ma_ncc}` | `NHA_CUNG_CAP_VIEW` |
| `POST /api/nha-cung-cap` | `NHA_CUNG_CAP_CREATE` |
| `PUT /api/nha-cung-cap/{ma_ncc}` | `NHA_CUNG_CAP_UPDATE` |
| `PATCH /api/nha-cung-cap/{ma_ncc}/trang-thai` | `NHA_CUNG_CAP_CHANGE_STATUS` |
| `GET /api/nguyen-lieu-nha-cung-cap` | `NGUYEN_LIEU_NCC_VIEW` |
| `GET /api/nguyen-lieu-nha-cung-cap/{ma_nguyen_lieu_ncc}` | `NGUYEN_LIEU_NCC_VIEW` |
| `POST /api/nguyen-lieu-nha-cung-cap` | `NGUYEN_LIEU_NCC_CREATE` |
| `PUT /api/nguyen-lieu-nha-cung-cap/{ma_nguyen_lieu_ncc}` | `NGUYEN_LIEU_NCC_UPDATE` |
| `GET /api/nhu-cau-nguyen-lieu/{ma_lich_su_du_bao}` | `NHU_CAU_NGUYEN_LIEU_VIEW` |
| `GET /api/goi-y-nha-cung-cap` | `GOI_Y_NHA_CUNG_CAP_VIEW` |
| `GET /api/de-xuat-nhap-hang` | `DE_XUAT_NHAP_HANG_VIEW` |
| `GET /api/de-xuat-nhap-hang/{ma_de_xuat}` | `DE_XUAT_NHAP_HANG_VIEW` |
| `POST /api/de-xuat-nhap-hang` | `DE_XUAT_NHAP_HANG_CREATE` |
| `PATCH /api/de-xuat-nhap-hang/{ma_de_xuat}/duyet` | `DE_XUAT_NHAP_HANG_APPROVE` |
| `PATCH /api/de-xuat-nhap-hang/{ma_de_xuat}/tu-choi` | `DE_XUAT_NHAP_HANG_REJECT` |
| `POST /api/de-xuat-nhap-hang/{ma_de_xuat}/tao-don-mua` | `DON_MUA_CREATE` |
| `GET /api/don-mua-nguyen-lieu` | `DON_MUA_VIEW` |
| `GET /api/don-mua-nguyen-lieu/{ma_don_mua}` | `DON_MUA_VIEW` |
| `POST /api/don-mua-nguyen-lieu` | `DON_MUA_CREATE` |
| `PUT /api/don-mua-nguyen-lieu/{ma_don_mua}` | `DON_MUA_UPDATE` |
| `PATCH /api/don-mua-nguyen-lieu/{ma_don_mua}/duyet` | `DON_MUA_APPROVE` |
| `PATCH /api/don-mua-nguyen-lieu/{ma_don_mua}/tu-choi` | `DON_MUA_REJECT` |
| `PATCH /api/don-mua-nguyen-lieu/{ma_don_mua}/nhan-hang` | `DON_MUA_RECEIVE` |
| `GET /api/dashboard/tong-quan` | `DASHBOARD_VIEW` |
| `GET /api/dashboard/canh-bao-ton-kho` | `DASHBOARD_VIEW` |
| `GET /api/dashboard/hieu-suat-nha-cung-cap` | `NHA_CUNG_CAP_PERFORMANCE_VIEW` |
| `POST /api/du-bao/nhu-cau` | `DU_BAO_RUN` |
| `GET /api/du-bao/lich-su` | `DU_BAO_VIEW` |
| `GET /api/du-bao/moi-nhat` | `DU_BAO_VIEW` |
| `GET /api/du-bao/lich-su/{ma_lich_su_du_bao}` | `DU_BAO_VIEW` |
| `GET /api/users` | `USER_VIEW` |
| `GET /api/users/{ma_nguoi_dung}` | `USER_VIEW` |
| `POST /api/users` | `USER_ASSIGN_ROLE`, `USER_CREATE` |
| `PUT /api/users/{ma_nguoi_dung}` | `USER_UPDATE`; thêm USER_ASSIGN_ROLE khi body có vai_tro |
| `DELETE /api/users/{ma_nguoi_dung}` | `USER_DELETE` |
| `GET /api/roles` | `ROLE_VIEW` |
| `GET /api/roles/{ma_vai_tro}` | `ROLE_VIEW` |
| `POST /api/roles` | `ROLE_CREATE` |
| `PUT /api/roles/{ma_vai_tro}` | `ROLE_UPDATE` |
| `PUT /api/roles/{ma_vai_tro}/permissions` | `ROLE_ASSIGN_PERMISSION` |
| `GET /api/permissions` | `PERMISSION_VIEW` |
| `POST /api/imports/users` | `USER_ASSIGN_ROLE`, `USER_IMPORT` (service) |
| `POST /api/imports/san-pham` | `IMPORT_SAN_PHAM` (service) |
| `POST /api/imports/nguyen-lieu` | `IMPORT_NGUYEN_LIEU` (service) |
| `POST /api/imports/cong-thuc` | `IMPORT_CONG_THUC` (service) |
| `POST /api/imports/ton-kho-nguyen-lieu` | `IMPORT_TON_KHO` (service) |
| `POST /api/imports/nha-cung-cap` | `IMPORT_NHA_CUNG_CAP` (service) |
| `POST /api/imports/nguyen-lieu-nha-cung-cap` | `IMPORT_NGUYEN_LIEU_NCC` (service) |
| `POST /api/imports/ngay-le` | `IMPORT_NGAY_LE` (service) |
| `POST /api/imports/don-hang` | `IMPORT_DON_HANG` (service) |

Không còn require_role hoặc điều kiện ADMIN để cấp quyền trong route nghiệp vụ. Tên role còn trong catalog seed, prefix mã tài khoản (không dùng authorization), SQL dữ liệu lịch sử và frontend chưa refactor. Kiểm tra tài khoản admin/self để tránh tự xóa/đổi role vẫn giữ như trước; đây là bảo vệ mã tài khoản, không phải bypass theo role.

## 6. API quản trị

- GET /api/roles và GET /api/roles/{ma_vai_tro}: ROLE_VIEW.
- POST /api/roles: ROLE_CREATE; role mới mặc định không có quyền.
- PUT /api/roles/{ma_vai_tro}: ROLE_UPDATE, cập nhật tên/mô tả/trạng thái; không có DELETE cứng.
- GET /api/permissions: PERMISSION_VIEW.
- PUT /api/roles/{ma_vai_tro}/permissions: ROLE_ASSIGN_PERMISSION; body {"permissions":[...]}; validate tất cả key tồn tại rồi thay toàn bộ tập quyền trong transaction. [] thu hồi mọi quyền. Duplicate key được chuẩn hóa.
- Gán role dùng PUT /api/users/{ma_nguoi_dung} hiện có: USER_UPDATE; khi gửi vai_tro cần thêm USER_ASSIGN_ROLE. Role phải tồn tại/HOAT_DONG.
- POST /api/users cần USER_CREATE và USER_ASSIGN_ROLE. Role mới không thuộc prefix cũ dùng mã TKxx; vẫn giữ lock tạo mã trong PostgreSQL.
- Import user cần USER_IMPORT và USER_ASSIGN_ROLE, validate role hoạt động theo DB, không còn whitelist cố định.

## 7. Tests và kiểm tra cuối

Baseline trước refactor: **15/15 PASS**.

Sau refactor:

- Full regression trong Docker/PostgreSQL disposable: **33/33 PASS**, không skip.
- Chạy Windows mặc định: **28 PASS, 5 skip** (các test yêu cầu PostgreSQL).
- Ma trận 44 endpoint mua hàng × 9 actor: **396 trường hợp PASS** trong một test tổng hợp. Request thiếu body trả 422 chỉ chứng minh qua gate; thành công nghiệp vụ được kiểm tra riêng qua E2E.
- Dynamic RBAC: role fixture TEST_TRUONG_NHOM_MUA_HANG với DON_MUA_VIEW/APPROVE, GET 200, duyệt qua gate, POST 403; PASS. Role này chỉ tồn tại trong tests.
- Runtime add/revoke: cùng JWT duyệt 403 → 200 → 403 qua API gán quyền; PASS.
- Admin không có bypass; role/user inactive bị từ chối; /me/login trả permissions; role assignment/import dynamic; rollback khi permission không hợp lệ hoặc insert lỗi; PASS.
- E2E mua hàng repository giả lập: **3/3 PASS**.
- E2E mua hàng PostgreSQL/repository thật: **2/2 PASS**, nhận đủ và nhận thiếu, snapshot giá, PO duplicate, tồn generated column và supplier performance.
- Test migration trên schema fixture: giữ nguyên 8 user (gồm role legacy lạ), thay CHECK bằng FK, khớp catalog/seed, chạy lại không phục hồi quyền bị xóa; PASS.
- Health/OpenAPI trên TestClient với PostgreSQL test: PASS.
- Smoke trên DB thật: /me 200 cho 5 user hoạt động, 403 cho KHO01/KHSX01; nguyên liệu đúng quyền; tất cả transaction READ ONLY.
- Smoke HTTP qua server kiểm tra tạm tại 127.0.0.1:8001: /api/v1/health **200, database connected**, /openapi.json **200** (58 paths). Container kiểm tra tạm được dừng sau khi xác minh.
- Compile src/tests/scripts và git diff --check: PASS.

Fixture trên PostgreSQL dùng outer transaction + savepoint, rollback sau mỗi test. Runner chỉ clone schema, không copy dữ liệu thật, tự tạo/xóa database riêng có prefix milano_rbac_test_; fingerprint database nguồn không đổi trong quá trình tests. Không kết luận đã test concurrency bằng nhiều transaction cạnh tranh: code lock/state machine vẫn giữ nguyên, E2E kiểm tra duplicate/nhận hai lần theo tuần tự.

## 8. File thay đổi và phạm vi nghiệp vụ

Thêm: core/permission_catalog.py, models/rbac_model.py, repositories/rbac_repository.py, services/authorization_service.py, services/rbac_service.py, dependencies/permission_dependency.py, schemas/rbac_schema.py, routes/rbac_routes.py, migration SQL, tests RBAC/migration/PostgreSQL và scripts kiểm tra.

Sửa: model user FK; model exports; auth repository (đọc trạng thái mới), auth service/controller/schema/routes; user schema/repository/service/routes; import permission/service; api_router và 11 route nghiệp vụ (10 mua hàng + dự báo); fixtures permission/purchase flow hiện có.

Xóa dependency require_role đã không còn được dùng. Thêm optional_columns rỗng cho template import user vì code hiện tại tham chiếu biến chưa định nghĩa; cần cho test import role dynamic.

Không sửa forecast, công thức BOM/hệ số thu hồi, tồn kho/shortage, supplier ranking/scoring, proposal/PO state machine, nhận hàng/inventory update hay Dashboard calculations. Không sửa frontend. Các thay đổi working tree có sẵn trước tác vụ được giữ nguyên (bao gồm sửa import nghiệp vụ của user).

## 9. Chạy kiểm tra lại

Từ backend:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe scripts/run_rbac_postgres_tests.py
.\.venv\Scripts\python.exe -m compileall -q src tests scripts
git diff --check
```

PostgreSQL runner cần container milano_postgres và image/container backend đã có. Nó tự lấy network/image từ Docker, dùng schema nguồn và áp dụng các prerequisite lên DB test riêng.

Khi áp dụng ở môi trường khác, chạy migration cột liên hệ user nếu còn thiếu và migration RBAC trước khi chạy backend mới; không sửa migration lịch sử. Không tự seed lại grant khi restart backend. Permission catalog thêm key trong tương lai cần một migration seed mới, không bypass ADMIN.

Máy hiện có PostgreSQL Windows chiếm cổng 5432. Kiểm tra DB Docker dùng mạng nội bộ Docker; cấu hình DB_HOST=postgres phù hợp Docker Compose. Nếu chạy backend trực tiếp trên Windows, phải xác định đúng host/port của DB mong muốn; không mặc định localhost:5432 là container.
