## Task 1 – Codebase Issue Analysis (Summary)

### 1. Issues (≥5) with Severity, Path + Line, Impact, Fix

#### Issue 1 – Broken logout when refresh token fails

- **Severity**: Major
- **Location**:
  - `shared/src/lib/interceptors/auth.interceptor.ts` (≈ L36–58)
  - `shared/src/lib/services/auth.service.ts` (≈ L85–94)
  - compare with: `front-b2b/src/app/layout/components/header/header.component.ts` (≈ L174–182)
- **Impact (real world)**:
  - When refresh token is expired/invalid, interceptor calls `logout()` but does not subscribe, so `accessToken`, `currentUser`, and `permissions` are not cleared.
  - UI still thinks user is logged in, but all APIs return 401. App does not move back to login screen, so admin actions keep failing.
- **Fix direction**:
  - In interceptor, when refresh fails: add `.subscribe()` on `authService.logout()` so `finalize()` runs and clears state.
  - In `front-management` header: same idea, add `.subscribe()` on `this.auth.logout()` and move `navigateByUrl('/login')` into the callback.

---

#### Issue 2 – File upload has no type/size limit, ACL is `public-read`

- **Severity**: Critical
- **Location**:
  - `api-service/src/app/common/services/storage.service.ts` (≈ L30–60)
  - `api-service/src/app/product/product.controller.ts` (≈ L33–44)
- **Impact (real world)**:
  - A user with `product:create` can upload very large files or any file type (exe/html/js), and all files are public.
  - This can be abused for phishing/malware hosting, or large-file spam that increases cost and hurts performance.
- **Exploit scenario**:
  - Upload a malicious HTML page and share the link from the system bucket/domain.
  - Run a script to upload hundreds of huge files to burn money.
- **Fix direction (short)**:
  - In controller: configure Multer (`FilesInterceptor`) with a `fileSize` limit and MIME whitelist (only valid image types).

---

#### Issue 3 – Pagination `limit` has no MAX, can lead to DoS

- **Severity**: Critical
- **Location**:
  - `api-service/src/app/common/dto/pagination.dto.ts` (≈ L4–19)
  - `api-service/src/app/merchant/merchant.service.ts` (≈ L49–70)
  - `api-service/src/app/agency/agency.service.ts` (≈ L43–70)
- **Impact (real world)**:
  - `PaginationDto` only checks `Min(1)` for `limit`, no `Max`.
  - Merchant/agency list services use `take = query.limit ?? 10`, so client can call `?limit=1000000`, creating very heavy DB queries (CPU/RAM/I/O load).
- **Exploit scenario**:
  - Bot script spams list endpoints with huge `limit` values to overload DB/API (application-level DoS).
- **Fix direction (short)**:
  - Define `MAX_LIMIT` in `PaginationDto`.
  - Clamp `limit` in all list services before using it as `take`.

---

#### Issue 4 – Category API is not paginated, but client still exposes `page`/`limit`

- **Severity**: Critical
- **Location**:
  - `api-service/src/app/category/category.controller.ts` (≈ L29–31)
  - `api-service/src/app/category/category.service.ts` (≈ L24–30)
  - `shared/src/lib/services/category.service.ts` (≈ L14–37)
- **Impact (real world)**:
  - Backend always returns the full category tree (including `children`), ignoring `page/limit`.
  - Client has `CategoryQueryParams` with `page/limit`, so developers may think pagination exists.
  - As categories grow, every related screen loads the whole tree, increasing payload size and slowing admin UI.
- **Fix direction (short)**:
  - If full tree is the final decision: remove `page/limit` from client and rename method clearly, e.g. `findAllTree()`.
  - If pagination is the final decision: add `CategoryQueryDto` extending `PaginationDto`, return `{ data, total, page, limit }`, and update shared service + consumers.

#### Issue 5 – OTP missing rate limit / brute-force protection

- **Severity**: Major
- **Location**:
  - `api-service/src/app/otp/otp.service.ts` (≈ L14–31, 33–60)
- **Impact (real world)**:
  - No limit on `requestOtp` attempts or wrong `verifyOtp` attempts.
  - Once real SMS is integrated, attackers can spam OTP for one phone number or brute-force OTP within the 5-minute validity window.
- **Exploit scenario**:
  - Spam `requestOtp` so the victim gets flooded with SMS.
  - Try many OTP codes in 5 minutes until one matches, then take over login/registration flow.
- **Fix direction (short)**:
  - Add per-phone and per-IP rate limits (N OTP requests / 15 mins, M failed verify attempts / 5-10 mins).
  - Store counters with TTL in DB/Redis and reject when threshold is exceeded; optionally add CAPTCHA after threshold.

---

### 2. Top 3 Critical Issues (and why)

1. **Pagination without max `limit` (Issue 3 – Critical)**

   - Any client (even without special permissions) can send huge `limit` values and overload DB/API (application-level DoS).

2. **Uncontrolled file upload + `public-read` (Issue 2 – Critical)**

   - Allows public upload of arbitrary content, which combines security risk (phishing/malware) and cost/performance risk (large-file spam). Cleanup is hard after abuse starts.

3. **Broken auto-logout when refresh fails (Issue 1 – Major)**
   - Affects all logged-in users: UI thinks session is active but backend rejects all requests. Very bad UX and hard to support, even though it is not as direct an attack vector as issues 2 and 3.

---

### 3. Cross-layer Issues (Backend → API → Frontend)

- **Merchant/agency pagination**: DTO + response contract has no `MAX_LIMIT` guard, so one contract gap impacts both backend and admin frontend.
- **Category**: backend always returns full tree, frontend exposes `page/limit` but they are ignored → contract mismatch and future performance risk.
- **Auth**: backend auth + shared `AuthService` + interceptor are tightly connected; refresh-fail logout bug causes auth state mismatch between server and client.

---

### 4. CI/CD & Lint (to prevent repeat issues)

- **RxJS/HTTP lint**: add a rule to block floating Observables for important methods (`logout`, `refreshToken`, ...), and enforce usage via shared service/interceptor.
- **Pagination tests**: unit tests for `PaginationDto` + e2e tests for list endpoints to ensure `MAX_LIMIT` is respected.
- **Upload tests**: test MIME and file size rules, and prevent wrong ACL setup.
- **OTP tests**: integration tests for `requestOtp` spam and `verifyOtp` brute-force to make sure rate limiting keeps working.

---

### 5. One-week sprint plan

- **D1**: Fix logout/refresh flow + tests.
- **D2**: Add HTTP timeout/retry interceptor + UI error handling.
- **D3**: Add pagination `MAX_LIMIT` + e2e tests.
- **D4**: Harden upload (MIME/size/ACL) + tests.
- **D5**: Add OTP rate limit + spam/brute-force tests.
- **D6**: Finalize category strategy (full tree vs paginated) and refactor backend + client.
- **D7**: Add smoke/e2e checks for core flows + short developer docs.
