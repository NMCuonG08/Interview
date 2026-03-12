## Task 1 – Codebase Issue Analysis (Summary)

### 1. Issues (≥5) với Severity, Path + Line, Impact, Fix

#### Issue 1 – Broken logout khi refresh token fail

- **Severity**: Major
- **Location**:
  - `shared/src/lib/interceptors/auth.interceptor.ts` (≈ L36–58)
  - `shared/src/lib/services/auth.service.ts` (≈ L85–94)  
    so sanh: `front-b2b/src/app/layout/components/header/header.component.ts (≈ L174–182)`
- **Impact (thực tế)**:
  - Khi refresh token hết hạn/invalid, interceptor gọi `logout()` nhưng không subscribe → không clear `accessToken`, `currentUser`, `permissions`.
  - UI vẫn nghĩ user đăng nhập nhưng mọi API trả 401, không tự về màn login → admin thao tác gì cũng fail.
- **Hướng fix**:
  - Trong interceptor, khi refresh fail: thêm `.subscribe()` vào `authService.logout()` để `finalize()` chạy và clear state.
  - Trong `front-management` header: tương tự, thêm `.subscribe()` vào `this.auth.logout()` và move `navigateByUrl('/login')` vào trong callback.

---

#### Issue 2 – File upload: không giới hạn type/size, ACL `public-read`

- **Severity**: Critical
- **Location**:
  - `api-service/src/app/common/services/storage.service.ts` (≈ L30–60)
  - `api-service/src/app/product/product.controller.ts` (≈ L33–44)
- **Impact (thực tế)**:
  - User có quyền `product:create` có thể upload file cực lớn hoặc file bất kỳ (exe/html/js), tất cả đều public.
  - Dễ bị lợi dụng để host phishing/malware, hoặc spam file lớn làm đội chi phí, ảnh hưởng hiệu năng.
- **Exploit scenario**:
  - Upload trang HTML độc hại và share link từ domain/bucket của hệ thống cho người dùng khác.
  - Script spam upload hàng trăm file dung lượng lớn để “đốt” tiền.
- **Hướng fix (tóm tắt)**:
  - Ở controller: cấu hình Multer (`FilesInterceptor`) với `fileSize` limit + MIME whitelist (chỉ image hợp lệ).

---

#### Issue 3 – Phân trang: `limit` không có MAX → dễ DoS

- **Severity**: Critical
- **Location**:
  - `api-service/src/app/common/dto/pagination.dto.ts` (≈ L4–19)
  - `api-service/src/app/merchant/merchant.service.ts` (≈ L49–70)
  - `api-service/src/app/agency/agency.service.ts` (≈ L43–70)
- **Impact (thực tế)**:
  - `PaginationDto` chỉ check `Min(1)` cho `limit`, không có `Max`.
  - Service list merchant/agency dùng `take = query.limit ?? 10` → client có thể gọi `?limit=1000000`, query cực nặng, ăn CPU/RAM/I/O DB.
- **Exploit scenario**:
  - Bot script spam các endpoint list với `limit` cực lớn để đánh sập DB/API (application‑level DoS).
- **Hướng fix (tóm tắt)**:
  - Định nghĩa `MAX_LIMIT` trong `PaginationDto`
  - Mọi service list dùng `limit` đã clamp khi set `take`.

---

#### Issue 4 – Category API không phân trang, client lại expose `page`/`limit`

- **Severity**: Critical 
- **Location**:
  - `api-service/src/app/category/category.controller.ts` (≈ L29–31)
  - `api-service/src/app/category/category.service.ts` (≈ L24–30)
  - `shared/src/lib/services/category.service.ts` (≈ L14–37)
- **Impact (thực tế)**:
  - Backend luôn trả full tree category (kể cả `children`), bỏ qua `page/limit`.
  - Client có `CategoryQueryParams` với `page/limit` nên dễ làm dev tưởng có phân trang.
  - Khi category nhiều: mỗi lần mở màn liên quan category → tải cả cây, payload to, UI admin bị chậm.
- **Hướng fix (tóm tắt)**:
  - Nếu chốt full tree: bỏ `page/limit` khỏi client, đặt tên method rõ nghĩa kiểu `findAllTree()`.
  - Nếu chốt phân trang: thêm `CategoryQueryDto` extend `PaginationDto`, API trả `{ data, total, page, limit }`, update shared service + chỗ dùng để xử lý paginated result.

#### Issue 5 – OTP: thiếu rate limit / chống brute‑force

- **Severity**: Major
- **Location**:
  - `api-service/src/app/otp/otp.service.ts` (≈ L14–31, 33–60)
- **Impact (thực tế)**:
  - Không giới hạn số lần `requestOtp` / số lần `verifyOtp` sai.
  - Khi gắn SMS thật: dễ bị spam OTP cho 1 số, hoặc brute‑force mã OTP trong 5 phút validity.
- **Exploit scenario**:
  - Spam `requestOtp` để nạn nhân bị ngập SMS.
  - Thử rất nhiều mã OTP trong 5 phút đến khi trúng → chiếm quyền đăng nhập/đăng ký.
- **Hướng fix (tóm tắt)**:
  - Áp dụng rate limit per‑phone, per‑IP (N request OTP / 15 phút, M lần verify sai / 5–10 phút).
  - Dùng DB/Redis lưu counter có TTL, reject khi vượt ngưỡng; có thể thêm CAPTCHA khi vượt ngưỡng.

---

### 2. Top 3 Critical Issues (và lý do)

1. **Không giới hạn `limit` phân trang (Issue 4 – Critical)**

   - Cho phép bất kỳ client (kể cả không có quyền đặc biệt) bắn query `limit` rất lớn, dễ dàng gây quá tải DB/API (application‑level DoS) cho toàn bộ hệ thống.

2. **File upload thiếu kiểm soát + `public-read` (Issue 3 – Critical)**

   - Cho phép upload tuỳ ý nội dung public, kết hợp rủi ro bảo mật (phishing/malware) và chi phí/hiệu năng (spam file lớn), rất khó dọn dẹp nếu đã bị lạm dụng.

3. **Broken auto‑logout khi refresh fail (Issue 1 – Major)**
   - Ảnh hưởng mọi user đăng nhập: UI tin là còn login nhưng backend reject hết, gây trải nghiệm rất tệ và khó hỗ trợ, dù không phải là lỗ hổng tấn công trực tiếp như hai issue trên.

---

### 3. Cross-layer Issues (Backend → API → Frontend)

- **Pagination merchants/agencies**: DTO + response align  không có `MAX_LIMIT` → lỗ hổng từ tầng contract, ảnh hưởng backend + admin frontend.
- **Category**: backend luôn trả full tree, frontend expose `page/limit` nhưng ignore → contract mismatch, dễ gây performance issue về sau.
- **Auth**: backend auth + shared `AuthService` + interceptor dính chặt; bug logout refresh fail làm lệch trạng thái auth giữa server và client.

---

### 4. CI/CD & Lint (ngăn tái diễn)

- **Lint RxJS/HTTP**: rule cấm “floating Observable” cho hàm quan trọng (`logout`, `refreshToken`, ...), và bắt buộc đi qua shared service/interceptor.
- **Pagination tests**: unit test cho `PaginationDto` + e2e cho list endpoints đảm bảo không vượt `MAX_LIMIT`.
- **Upload tests**: test MIME/size, tránh ACL sai.
- **OTP tests**: integration test cho spam `requestOtp` + brute‑force `verifyOtp` để chắc chắn rate limit còn hoạt động.

---

### 5. Kế hoạch sprint 1 tuần

- **D1**: Sửa logout/refresh flow + test.
- **D2**: Thêm HTTP timeout/retry interceptor + UI error handling.
- **D3**: Thêm `MAX_LIMIT` phân trang + e2e test.
- **D4**: Harden upload (MIME/size/ACL) + test.
- **D5**: Thêm rate limit OTP + test spam/brute‑force.
- **D6**: Chốt chiến lược category (full tree vs paginated) và refactor backend + client.
- **D7**: Bổ sung smoke/e2e cho các flow chính + docs ngắn cho dev.
