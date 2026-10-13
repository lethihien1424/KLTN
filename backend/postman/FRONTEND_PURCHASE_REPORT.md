# Frontend mua nguyên liệu – Milano Coffee

Hoàn thành ngày 04/10/2026 theo kế hoạch FE phần Hiền phụ trách. Các màn được triển khai lần lượt từ auth, sidebar, danh mục đến luồng đề xuất/đơn mua, nhận hàng, hiệu suất và dashboard.

## Giao diện và chức năng

Sidebar trái, nền xanh xám nhạt, card trắng, border bo góc, nút chính xanh, badge trạng thái và bảng có tìm kiếm/lọc/phân trang. Giao diện thích ứng với điện thoại; bảng rộng cuộn ngang trong vùng bảng. Drawer giữ nút Lưu/Xác nhận ở footer và cuộn nội dung riêng.

| Màn hình | Chức năng | Quyền xem |
| --- | --- | --- |
| Tổng quan | Dashboard nếu có quyền; nếu không, các lối tắt được cấp quyền | DASHBOARD_VIEW cho dữ liệu dashboard |
| Nguyên liệu | Danh sách, tạo, sửa tên/đơn vị, đổi trạng thái có xác nhận | NGUYEN_LIEU_VIEW |
| Công thức BOM | Lọc sản phẩm/trạng thái, chi tiết, tạo/sửa, đổi trạng thái | CONG_THUC_VIEW |
| Tồn kho nguyên liệu | Bản ghi mới nhất, mức tồn an toàn, tạo/sửa, lịch sử | TON_KHO_VIEW; TON_KHO_HISTORY_VIEW cho lịch sử |
| Nhà cung cấp | Tạo/sửa, trạng thái, tính điểm, chi tiết với tab thông tin/cung ứng/hiệu suất | NHA_CUNG_CAP_VIEW |
| Nguyên liệu cung ứng | Giá, tồn NCC, book/xuất, khả dụng, lead time, tỷ lệ chất lượng/giao hàng | NGUYEN_LIEU_NCC_VIEW |
| Dự báo | Giữ màn dự báo hiện có; thêm nút sang nhu cầu từ kết quả hiện tại/lịch sử | DU_BAO_VIEW |
| Nhu cầu nguyên liệu | Chọn lần dự báo, 4 summary cards, lọc nhu cầu, xem NCC | NHU_CAU_NGUYEN_LIEU_VIEW |
| Gợi ý NCC | Xếp hạng theo kết quả backend, chọn NCC đủ cung ứng, sang tạo đề xuất | GOI_Y_NHA_CUNG_CAP_VIEW |
| Đề xuất nhập hàng | Tạo nhiều dòng, danh sách theo trạng thái, chi tiết, duyệt/từ chối, sinh đơn theo NCC | DE_XUAT_NHAP_HANG_VIEW; CREATE cho màn tạo |
| Đơn mua nguyên liệu | Tạo/cập nhật, lọc NCC/ngày/trạng thái, chi tiết, duyệt/từ chối | DON_MUA_VIEW |
| Nhận hàng | Ngày thực nhận, số lượng từng dòng, lý do nhận thiếu, xác nhận và kết quả cập nhật tồn | DON_MUA_VIEW + DON_MUA_RECEIVE |
| Hiệu suất NCC | Điểm, tỷ lệ thực tế, tính lại từng NCC/tất cả khi có quyền | NHA_CUNG_CAP_PERFORMANCE_VIEW |
| Dashboard mua hàng | Thống kê, trạng thái đề xuất/đơn mua, cảnh báo tồn, bảng hiệu suất khi được cấp quyền | DASHBOARD_VIEW; quyền hiệu suất riêng |
| Nhập bán hàng | Upload CSV/XLSX vào API import đơn hàng | IMPORT_DON_HANG |
| Tài khoản | Giữ màn hiện có; bổ sung kiểm tra quyền tạo/sửa/xóa/import/gán role | USER_VIEW |

Các thao tác dùng đúng permission riêng: *_CREATE, *_UPDATE, *_CHANGE_STATUS, *_APPROVE, *_REJECT, DON_MUA_RECEIVE, NHA_CUNG_CAP_SCORE. Chỉ hiển thị duyệt/từ chối ở trạng thái chờ duyệt; chỉ nhận đơn DA_DUYET. Không có bypass ADMIN.

## Auth, quyền và API

- Sau đăng nhập, lưu token rồi lấy `/api/auth/me` trước khi render giao diện. `permissions` từ `/me` quyết định menu, route và action. Tên vai trò chỉ dùng để hiển thị thông tin tài khoản.
- Role mới dùng ngay khi được cấp các permission hiện có; không cần thêm nhánh role trong App.
- Làm mới quyền khi cửa sổ lấy focus, sau HTTP 403, qua nút “Làm mới quyền”, và mỗi 60 giây khi trang đang hiển thị. HTTP 401 kết thúc phiên. Lỗi mạng khi kiểm tra phiên đầu tiên có nút thử lại và giữ token.
- Backend là nơi quyết định cuối cùng. Client xử lý lỗi mạng, lỗi nghiệp vụ, validation FastAPI và ngăn gửi lặp trong lúc mutation đang chạy.
- Route dùng hash (`#/nguyen-lieu`, `#/don-mua/DM...`) nên tải lại đường dẫn chi tiết không cần cấu hình rewrite server.
- Các service mua hàng dùng Bearer token và `VITE_API_URL`, mặc định `http://localhost:8000`. Đường dẫn đơn mua thực tế là `/api/don-mua-nguyen-lieu`.
- Màn dự báo và tài khoản được tải riêng khi mở. Bundle ban đầu khoảng 246 kB trước gzip; chunk tài khoản hiện có khoảng 974 kB do các thư viện Excel/icon, Vite còn cảnh báo kích thước chunk đó.

Component dùng chung: PageHeader, SummaryCard, StatusBadge, DataTable, SearchInput, FilterSelect, PermissionGuard, ConfirmDialog, FormDrawer, EmptyState, LoadingState, ErrorState, Field, ReviewDialog và bộ chọn nguyên liệu/NCC.

## Validation và bám hợp đồng backend

- BOM: tỷ lệ từng dòng > 0 và <= 1, tối đa 4 số thập phân; tổng tỷ lệ phải bằng 100%; không trùng nguyên liệu. Hệ số thu hồi > 0 và <= 1; hao hụt >= 0 và < 1.
- Tồn kho: số lượng không âm, tối đa 2 số thập phân; tồn tối đa >= tồn an toàn. Không gửi tồn khả dụng vào payload, backend tự tính. Tổng lượng tồn được nhóm riêng theo đơn vị đo.
- Cung ứng: giá dương, số lượng không âm, book/xuất không vượt tồn NCC; lead time là số nguyên dương; các tỷ lệ 0–1.
- Đề xuất: số lượng dương, không trùng cặp nguyên liệu/NCC. Chỉ sinh đơn khi đề xuất đã duyệt; chọn ngày giao không trước ngày hiện tại. Lỗi sinh đơn trùng từ backend được hiển thị.
- Đơn mua: không trùng nguyên liệu, ngày giao dự kiến >= ngày đặt, số lượng dương; giá/tiền do backend tính.
- Nhận hàng: 0 <= thực nhận <= lượng đặt; nhận thiếu phải có lý do không chỉ gồm khoảng trắng; gửi đủ tất cả dòng; ngày nhận từ ngày đặt đến hôm nay. Thành công hiển thị DA_NHAN_HANG và ẩn nút nhận lần nữa.
- API tạo nguyên liệu yêu cầu mã nguyên liệu nên form có trường mã. API BOM yêu cầu mã sản phẩm và chưa có endpoint đọc danh mục sản phẩm, nên nhập mã sản phẩm đã tồn tại.
- API nguyên liệu không trả timestamp nên không tạo cột “Cập nhật” giả. API danh sách đề xuất không trả số dòng nên số nguyên liệu được hiển thị ở chi tiết, không gọi thêm một API cho từng dòng.
- Không có DU_BAO_VIEW vẫn có thể nhập mã dự báo ở màn nhu cầu nếu được cấp NHU_CAU_NGUYEN_LIEU_VIEW. Các form có thể nhập mã nguyên liệu/NCC nếu không được cấp quyền đọc danh mục tương ứng.
- Tỷ lệ giao hàng thực tế chưa có dữ liệu hiển thị “Chưa có dữ liệu”/“—”, không tự thay bằng 0%. Sau khi nhận hàng, người có NHA_CUNG_CAP_SCORE dùng tính lại điểm để cập nhật hiệu suất.

## Kiểm chứng

1. `npm run build`: **PASS**, TypeScript strict và Vite production build.
2. `npm run test:e2e`: **13/13 PASS** trên Microsoft Edge headless, gồm đăng nhập lấy quyền mới từ `/me`; luồng từ kết quả dự báo đến nhu cầu, gợi ý, đề xuất, duyệt, sinh đơn, duyệt đơn, nhận hàng, tồn kho, tính điểm và dashboard; role tùy chỉnh; ADMIN không quyền; route bị chặn; từ chối; nhận thiếu/nhận 0/nhận vượt; BOM; CRUD nguyên liệu; validation tồn kho/cung ứng; 403 cập nhật quyền; 401 hết phiên; retry lỗi API; viewport 390 px không tràn trang. Đã kiểm tra ảnh desktop và mobile.
3. `node scripts/smoke-readonly.mjs`: **36/36 PASS** trên backend Docker thật và dữ liệu hiện có. `/me` trả 55/35/17 quyền cho admin/MH01/QLMH. MH01 bị 403 ở hai endpoint dashboard; các endpoint khác khớp quyền được cấp. Kết quả lưu ở [API_READONLY_VERIFICATION.json](reports/API_READONLY_VERIFICATION.json).
4. `git diff --check`: **PASS**.

Bài test trình duyệt dùng API giả lập để kiểm tra giao diện, payload và thứ tự chuyển trạng thái, không ghi dữ liệu demo vào database thật. Smoke API thật chỉ gửi GET; token phát trong container phát triển, không in token và không gọi đăng nhập. Chưa chạy thao tác tạo/duyệt/nhận hàng từ trình duyệt trên DB thật trong tác vụ này. Logic tăng tồn, giá, dự báo và scoring của backend được giữ nguyên.

## Xem giao diện mới

Backend và PostgreSQL hiện đã chạy bằng Docker. Container frontend hiện tại dùng code trong image; sửa source trên máy chưa cập nhật image đó. Từ PowerShell:

```powershell
cd "E:\KLTN\lan 1merge\KLTN"
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose up -d --build --no-deps frontend
```

Mở **http://localhost:5173**, đăng nhập lại để lấy quyền mới. Lệnh trên cập nhật frontend, dùng backend/PostgreSQL đang chạy.

Nếu chạy frontend trực tiếp trên máy, dùng `npm ci` rồi `npm run dev` trong thư mục frontend, bảo đảm cổng 5173 trống và backend cho phép origin `http://localhost:5173`. `VITE_API_URL` có thể đặt trong `.env.local` nếu backend dùng địa chỉ khác.

## Chạy kiểm tra lại

```powershell
cd "E:\KLTN\lan 1merge\KLTN\frontend"
npm ci
npm run build
npm run test:e2e
node scripts/smoke-readonly.mjs
```

E2E dùng Vite cổng 5175 và mặc định Edge trên Windows; có thể đổi `PW_BROWSER_CHANNEL` nếu cần. Trên Linux dùng Chromium của Playwright (`npx playwright install chromium`). Smoke thật cần container `milano_backend` và backend ở cổng 8000, cùng các tài khoản demo đang hoạt động. Không chạy smoke phát token này trên môi trường production.

## Luồng demo

1. Người có DU_BAO_RUN chạy dự báo sản phẩm; người mua có DU_BAO_VIEW xem kết quả và bấm “Xem nhu cầu nguyên liệu”.
2. Xem nguyên liệu cần mua → Xem NCC → chọn NCC đủ cung ứng → tạo đề xuất.
3. Người có DE_XUAT_NHAP_HANG_APPROVE duyệt đề xuất.
4. Người có DON_MUA_CREATE tạo đơn từ đề xuất, chọn ngày giao.
5. Người có DON_MUA_APPROVE duyệt đơn.
6. Người có DON_MUA_RECEIVE nhận hàng, nhập lượng thực nhận và lý do nếu thiếu.
7. Xem tồn kho cập nhật; tính lại hiệu suất NCC khi có NHA_CUNG_CAP_SCORE; xem dashboard khi có DASHBOARD_VIEW.

Các sửa đổi backend/database và tài liệu RBAC đã có từ tác vụ trước được giữ nguyên; frontend không thay thuật toán nghiệp vụ backend.
