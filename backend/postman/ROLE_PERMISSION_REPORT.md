# Báo cáo cập nhật actor backend mua hàng

Báo cáo giai đoạn trước RBAC. Cấu hình hiện tại và kết quả mới nằm trong [RBAC_REPORT.md](RBAC_REPORT.md).

Ngày: 04/10/2026.

## Phạm vi và file sửa

- `src/core/import_permissions.py`.
- 10 file route: `nguyen_lieu_routes.py`, `cong_thuc_routes.py`, `ton_kho_routes.py`, `nha_cung_cap_routes.py`, `nguyen_lieu_nha_cung_cap_routes.py`, `nhu_cau_nguyen_lieu_routes.py`, `goi_y_nha_cung_cap_routes.py`, `de_xuat_nhap_hang_routes.py`, `don_mua_routes.py`, `dashboard_routes.py`.
- Thêm `requirements-dev.txt` và 3 file test trong `tests/`.
- Không sửa frontend, model/schema DB, migration hay thuật toán nghiệp vụ. Những thay đổi có sẵn trong working tree trước tác vụ được giữ nguyên.

## Kết quả

- Nhận hàng: ADMIN và NHAN_VIEN_MUA_HANG; loại NHAN_VIEN_KHO.
- Duyệt/từ chối đề xuất và PO: ADMIN và QUAN_LY_MUA_HANG; loại QUAN_LY.
- Dashboard: ADMIN và QUAN_LY_MUA_HANG. Không mở cho nhân viên mua hàng hoặc actor bán hàng.
- QUAN_LY_MUA_HANG chỉ xem dữ liệu và duyệt/từ chối, ngoại trừ hai API tính điểm NCC được mở theo yêu cầu. Không được tạo/sửa nguyên liệu, BOM, tồn kho, NCC, mapping, đề xuất, PO hoặc nhận hàng.
- Import cũng thực hiện ghi dữ liệu nên chỉ ADMIN/NHAN_VIEN_MUA_HANG được import nguyên liệu, BOM, tồn kho, NCC và mapping. Quyền import bán hàng được chuyển theo actor: GIAM_SAT_BAN_HANG → NHAN_VIEN_BAN_HANG, phần bán hàng của QUAN_LY → QUAN_LY_BAN_HANG.
- Không còn literal role cũ QUAN_LY, NHAN_VIEN_KHO, NHAN_VIEN_KE_HOACH_SAN_XUAT, GIAM_SAT_BAN_HANG trong `src/`. Tests giữ các role cũ để kiểm tra bị từ chối.
- Auth đã check `trang_thai != HOAT_DONG` khi login và khi xác thực token; không cần sửa auth.
- Không cần migration cho thay đổi permission này. Schema role trong database thực tế chưa xác minh do không kết nối được PostgreSQL.

## Endpoint và quyền trước/sau

Quyền ghi còn áp dụng đồng thời với quyền cấp router. Bảng dưới thể hiện quyền hiệu lực.

| Endpoint | Trước | Sau |
| --- | --- | --- |
| `GET /api/nguyen-lieu` | ADMIN, NHAN_VIEN_KHO | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `GET /api/nguyen-lieu/{ma_nguyen_lieu}` | ADMIN, NHAN_VIEN_KHO | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `POST /api/nguyen-lieu` | ADMIN, NHAN_VIEN_KHO | ADMIN, NHAN_VIEN_MUA_HANG |
| `PUT /api/nguyen-lieu/{ma_nguyen_lieu}` | ADMIN, NHAN_VIEN_KHO | ADMIN, NHAN_VIEN_MUA_HANG |
| `PATCH /api/nguyen-lieu/{ma_nguyen_lieu}/trang-thai` | ADMIN, NHAN_VIEN_KHO | ADMIN, NHAN_VIEN_MUA_HANG |
| `GET /api/cong-thuc` | ADMIN, NHAN_VIEN_KE_HOACH_SAN_XUAT | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `GET /api/cong-thuc/{ma_cong_thuc}` | ADMIN, NHAN_VIEN_KE_HOACH_SAN_XUAT | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `POST /api/cong-thuc` | ADMIN, NHAN_VIEN_KE_HOACH_SAN_XUAT | ADMIN, NHAN_VIEN_MUA_HANG |
| `PUT /api/cong-thuc/{ma_cong_thuc}` | ADMIN, NHAN_VIEN_KE_HOACH_SAN_XUAT | ADMIN, NHAN_VIEN_MUA_HANG |
| `PATCH /api/cong-thuc/{ma_cong_thuc}/trang-thai` | ADMIN, NHAN_VIEN_KE_HOACH_SAN_XUAT | ADMIN, NHAN_VIEN_MUA_HANG |
| `GET /api/ton-kho-nguyen-lieu` | ADMIN, NHAN_VIEN_KHO | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `GET /api/ton-kho-nguyen-lieu/{ma_nguyen_lieu}` | ADMIN, NHAN_VIEN_KHO | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `GET /api/ton-kho-nguyen-lieu/{ma_nguyen_lieu}/{ngay_ghi_nhan}` | ADMIN, NHAN_VIEN_KHO | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `POST /api/ton-kho-nguyen-lieu` | ADMIN, NHAN_VIEN_KHO | ADMIN, NHAN_VIEN_MUA_HANG |
| `PUT /api/ton-kho-nguyen-lieu/{ma_nguyen_lieu}/{ngay_ghi_nhan}` | ADMIN, NHAN_VIEN_KHO | ADMIN, NHAN_VIEN_MUA_HANG |
| `POST /api/nha-cung-cap/tinh-diem` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `POST /api/nha-cung-cap/{ma_ncc}/tinh-diem` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `GET /api/nha-cung-cap` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `GET /api/nha-cung-cap/{ma_ncc}` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `POST /api/nha-cung-cap` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG |
| `PUT /api/nha-cung-cap/{ma_ncc}` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG |
| `PATCH /api/nha-cung-cap/{ma_ncc}/trang-thai` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG |
| `GET /api/nguyen-lieu-nha-cung-cap` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `GET /api/nguyen-lieu-nha-cung-cap/{ma_nguyen_lieu_ncc}` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `POST /api/nguyen-lieu-nha-cung-cap` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG |
| `PUT /api/nguyen-lieu-nha-cung-cap/{ma_nguyen_lieu_ncc}` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG |
| `GET /api/nhu-cau-nguyen-lieu/{ma_lich_su_du_bao}` | ADMIN, NHAN_VIEN_KE_HOACH_SAN_XUAT, NHAN_VIEN_MUA_HANG | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `GET /api/goi-y-nha-cung-cap` | ADMIN, NHAN_VIEN_MUA_HANG | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `GET /api/de-xuat-nhap-hang` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `GET /api/de-xuat-nhap-hang/{ma_de_xuat}` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `POST /api/de-xuat-nhap-hang` | ADMIN, NHAN_VIEN_MUA_HANG | ADMIN, NHAN_VIEN_MUA_HANG |
| `PATCH /api/de-xuat-nhap-hang/{ma_de_xuat}/duyet` | ADMIN, QUAN_LY | ADMIN, QUAN_LY_MUA_HANG |
| `PATCH /api/de-xuat-nhap-hang/{ma_de_xuat}/tu-choi` | ADMIN, QUAN_LY | ADMIN, QUAN_LY_MUA_HANG |
| `POST /api/de-xuat-nhap-hang/{ma_de_xuat}/tao-don-mua` | ADMIN, NHAN_VIEN_MUA_HANG | ADMIN, NHAN_VIEN_MUA_HANG |
| `GET /api/don-mua-nguyen-lieu` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `GET /api/don-mua-nguyen-lieu/{ma_don_mua}` | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY | ADMIN, NHAN_VIEN_MUA_HANG, QUAN_LY_MUA_HANG |
| `POST /api/don-mua-nguyen-lieu` | ADMIN, NHAN_VIEN_MUA_HANG | ADMIN, NHAN_VIEN_MUA_HANG |
| `PUT /api/don-mua-nguyen-lieu/{ma_don_mua}` | ADMIN, NHAN_VIEN_MUA_HANG | ADMIN, NHAN_VIEN_MUA_HANG |
| `PATCH /api/don-mua-nguyen-lieu/{ma_don_mua}/duyet` | ADMIN, QUAN_LY | ADMIN, QUAN_LY_MUA_HANG |
| `PATCH /api/don-mua-nguyen-lieu/{ma_don_mua}/tu-choi` | ADMIN, QUAN_LY | ADMIN, QUAN_LY_MUA_HANG |
| `PATCH /api/don-mua-nguyen-lieu/{ma_don_mua}/nhan-hang` | ADMIN, NHAN_VIEN_KHO | ADMIN, NHAN_VIEN_MUA_HANG |
| `GET /api/dashboard/tong-quan` | ADMIN, QUAN_LY | ADMIN, QUAN_LY_MUA_HANG |
| `GET /api/dashboard/canh-bao-ton-kho` | ADMIN, QUAN_LY | ADMIN, QUAN_LY_MUA_HANG |
| `GET /api/dashboard/hieu-suat-nha-cung-cap` | ADMIN, QUAN_LY | ADMIN, QUAN_LY_MUA_HANG |

## Kiểm thử

- Tổng regression của bộ test mới: **15/15 PASS**. Dự án chưa có bộ unit/E2E/regression sẵn trong checkout này.
- Ma trận HTTP: **44 endpoint × 9 actor = 396 trường hợp quyền**; tất cả PASS trong một test tổng hợp. Actor mới và ADMIN được kiểm tra cùng với role cũ để xác nhận từ chối. Với request ghi thiếu payload, 422 chỉ xác nhận vượt qua permission, không được tính là nghiệp vụ thành công.
- E2E HTTP với repository giả lập, controller/service và schema thật: **3/3 PASS** (đề xuất → duyệt → sinh PO → duyệt → nhận đủ; nhận thiếu và hiệu suất; tạo PO trực tiếp và nhận hàng).
- Kiểm tra snapshot giá, chống sinh PO trùng, chỉ nhận PO đã duyệt, không nhận vượt/âm, nhận thiếu phải có lý do, không cộng tồn hai lần, cộng đúng thực nhận và giữ booking. Kiểm tra service yêu cầu lock khi xử lý PO; chưa kiểm thử cạnh tranh transaction PostgreSQL.
- GET đề xuất/PO, nhu cầu từ forecast+BOM, ranking NCC và Dashboard không mutate dữ liệu fixture; tính điểm NCC giữ công thức cũ.
- Login unit test: NVBH, QLBH, MH01, QLMH, admin hoạt động được cấp token; KHO01/KHSX01 ngừng hoạt động nhận 403. Repository và password verification được giả lập; chưa xác minh password/tài khoản thật.
- OpenAPI và health qua TestClient: PASS; health dùng DB giả lập.
- Compile `src` và `tests`: PASS.
- `git diff --check`: PASS.
- Backend tại `localhost:8000`: không có server lắng nghe tại thời điểm kiểm tra. Health/OpenAPI trực tiếp chưa xác minh.
- PostgreSQL: kết nối từ cấu hình hiện tại thất bại với OperationalError. Không chạy được E2E/health/login trên database thật. Không ghi DB, không sửa dữ liệu, không reset DB; không có fixture cần rollback trên DB thật.

## Chạy lại

Từ thư mục backend:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m compileall -q src tests
git diff --check
```

Sau khi PostgreSQL và backend hoạt động, cần kiểm tra health thực tế và chạy integration với transaction rollback để xác nhận trạng thái user thật, constraint/generated inventory và concurrency. Không thể kết luận full regression trên PostgreSQL đã PASS từ bộ test giả lập này.
