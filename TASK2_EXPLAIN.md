## TASK 2 – Courier Registration Flow (Explain + Requirement Mapping)

## 1) Goal and business flow

The goal of Task 2 is to implement the full courier registration flow:

- Courier signs up for an account.
- The system creates a Courier record with PENDING status.
- Admin goes into the Management UI to review.
- Admin APPROVEs or REJECTs.
- Only APPROVED couriers can operate in the system.

The implementation covers this flow end-to-end: Database → Backend API → Frontend Management.

---

## 2) Part A – Database Design (10 points)

### A.1 Must-have: Analyze Courier vs Agency/Merchant

- **What was done:** Aligned Courier with the existing pattern used in Agency/Merchant — same approval status, basic metadata, and a clear lifecycle.
- **Why:** Keeping the same pattern makes services/controllers/query builders consistent, and reduces the risk of logic diverging between different actors in the system.
- **Status:** Done.

### A.2 Must-have: Extend schema if fields are missing

- **What was done** on the `Courier` model:
  - `externalId` (UUID, unique) – used as the public-facing ID instead of exposing the internal auto-increment id.
  - `approvalStatus` (`PENDING | APPROVED | REJECTED`).
  - `rejectionReason` – stores the rejection reason directly on the record.
  - `deletedAt` – for soft delete.
- **Why:**
  - `approvalStatus` is the core of the approval workflow.
  - `rejectionReason` keeps a snapshot of the current state so list/detail views don't need to join the audit table every time.
  - `deletedAt` avoids losing historical data when deleting.
- **Status:** Done.

### A.3 Must-have: Prisma migration for schema changes

- **What was done:**
  - Migration `20260311171627_courier_approval_status` – added new fields, unique constraints, and index.
  - Migration `20260312030153_courier_approval_audits` – created the `courier_approval_audits` table.
- **Why:** Splitting migrations into separate batches makes it easier to review diffs and roll back individual parts independently.
- **Status:** Done.

### A.4 Must-have: Update seed.ts with courier permissions and role mapping

- **What was done:**
  - Added permissions: `courier:create`, `courier:read`, `courier:update`, `courier:delete`, `courier:approve`, `courier:reject`.
  - `PLATFORM_ADMIN` role gets all permissions including the courier ones.
- **Why:** Explicit `resource:action` permissions let the guard control exactly which endpoint each role can access.
- **Status:** Done.

### A.5 Nice-to-have: Unique constraints for phone/email

- **What was done:** `phone` unique, `email` unique.
- **Why:** Prevents duplicate registrations with the same contact info.
- **Status:** Done.

### A.6 Nice-to-have: Index to optimize queries

- **What was done:** Composite index on `(approvalStatus, createdAt)`.
- **Why:** The pending list typically filters by status and sorts by registration time — this index hits that query directly.
- **Status:** Done.

### A.7 Nice-to-have: Soft delete

- **What was done:** Uses `deletedAt`; all service queries filter `deletedAt IS NULL`.
- **Why:** Keeps historical courier data but excludes those records from the main operational flow.
- **Status:** Done.

---

## 3) Part B – Backend API (10 points)

### B.1 Must-have: Create courier module following system architecture

- **What was done:** Full `Module`, `Controller`, `Service`, `DTO`, `Entity`, `QueryBuilder`.
- **Why:** Following the existing architecture keeps the code consistent with other modules and easier to maintain and test.
- **Status:** Done.

### B.2 Must-have: OTP registration flow similar to Agency

- **What was done:**
  - `POST /couriers/otp/request` – sends OTP via `OtpService`.
  - `POST /couriers/otp/verify` – validates OTP, returns a `verificationToken`.
  - `POST /couriers/register` – verifies the token, creates courier with default `PENDING` status.
- **Why:** Reusing the existing `OtpService` instead of writing a new one keeps OTP/expiry/rate-limit logic consistent across the system.
- **Status:** Done.

### B.3 Must-have: CRUD APIs for courier management

- **What was done:** `GET /couriers` (list + pagination + filters), `GET /couriers/:id`, `PATCH /couriers/:id` (update name/email/vehicleType/status), `DELETE /couriers/:id` (soft delete).
- **Why:** Gives Admin all the APIs needed to run the courier management screen. `PATCH` only updates fields that are actually sent in the request (spread conditional), so missing fields don't get overwritten with null.
- **Status:** Done.

### B.4 Must-have: Admin approval/rejection endpoints

- **What was done:** `POST /couriers/:id/approve`, `POST /couriers/:id/reject`.
- **Why:** Separate endpoints per action make guard/permission setup and audit logging cleaner and easier to follow.
- **Status:** Done.

### B.5 Must-have: Reject must include a reason

- **What was done:** `RejectCourierDto` validates `rejectionReason` as required (`@IsNotEmpty`).
- **Why:** Makes sure every rejection has a clear reason — useful for communicating back to the courier and for internal review.
- **Status:** Done.

### B.6 Must-have: Validation + role-based authorization

- **What was done:** DTO validation via `class-validator`; `JwtAuthGuard` + `PermissionsGuard` + `@Permissions(...)` on all admin endpoints.
- **Why:** Validation protects data integrity at the input level; authorization makes sure only the right roles can approve or reject.
- **Status:** Done.

### B.7 Must-have: Unit tests for approval flow

- **What was done:** 4 test cases:
  - Approve PENDING → success, audit written.
  - Approve is idempotent when already APPROVED → no update, no audit.
  - Reject PENDING → success, reason saved, audit written.
  - Reject is idempotent when already REJECTED → no update, no audit.
- **Why:** Covers the most important state transitions and the idempotent edge cases.
- **Status:** Done.

### B.8 Nice-to-have: OTP expiration + rate limiting

- **What was done:** OTP expires after 5 minutes; max 3 OTP requests per phone per 15 minutes.
- **Why:** Reduces OTP spam and lowers the risk of someone brute-forcing the OTP code.
- **Status:** Done.

### B.9 Nice-to-have: Idempotent approval endpoints

- **What was done:** `approve`/`reject` checks the current status before updating — skips if already in the target state.
- **Why:** Safe for client retries, avoids writing duplicate audit logs or mutating data unnecessarily.
- **Status:** Done.

### B.10 Nice-to-have: Audit logging for approval actions

- **What was done:** `courier_approval_audits` table stores `actorUserId`, `action`, `reason`, `createdAt`.
- **Why:** Separates current state (on `courier`) from history (on `audit`), so regular list queries don't need a join.
- **Status:** Done.

---

## 4) Part C – Frontend Management (10 points)

### C.1 Must-have: Pending Courier Approvals page

- **What was done:** Created the courier management screen in `front-management`, showing a data table.
- **Why:** This is the entry point for Admin to review registration requests.
- **Status:** Done.

### C.2 Must-have: Approve directly from the list

- **What was done:** Approve button on each table row, with a confirmation modal before calling the API.
- **Why:** Speeds up Admin's workflow when reviewing many couriers at once.
- **Status:** Done.

### C.3 Must-have: Reject via modal with reason input

- **What was done:** Reject button opens a modal; rejection reason is required before confirming.
- **Why:** Enforces the business rule on the UI side, prevents calling the API with an empty reason.
- **Status:** Done.

### C.4 Must-have: Unit tests for the component

- **What was done:** 4 test cases:
  - Loads the list on init.
  - Approve flow calls the right service and shows a notification.
  - Reject flow: validates empty reason, confirms with a valid reason.
  - Error handling when API fails → UI rollback.
- **Why:** Covers the most important interactions to make sure the component behaves correctly.
- **Status:** Done.

### C.5 Nice-to-have: Pagination

- **What was done:** Integrated `DataTableComponent` + `TablePagination`, sends `page`/`limit` to the backend.
- **Why:** Avoids loading all data at once, better performance and UX.
- **Status:** Done.

### C.6 Nice-to-have: Filtering by date or status

- **What was done:** Filter by status (PENDING/APPROVED/REJECTED), text search, and `startDate`/`endDate`. Backend accepts `startDate`/`endDate` via `CourierQueryDto`, and `CourierQueryBuilder.withDateRange()` applies `gte`/`lte` on `createdAt`.
- **Why:** Date filter helps Admin find couriers who registered in a specific time window, e.g. checking a particular recruitment batch.
- **Status:** Done.

### C.7 Nice-to-have: Toast notifications

- **What was done:** Success/error/warning modal feedback after approve/reject; API error messages are also shown to the user.
- **Why:** Lets the user know the result of their action right away instead of just seeing the UI change silently.
- **Status:** Done.

### C.8 Nice-to-have: Optimistic UI

- **What was done:** Updates the list immediately when approve/reject is clicked, then rolls back to the previous state if the API fails.
- **Why:** Makes the interaction feel faster while still keeping things correct when there's a network or API error.
- **Status:** Done.

---

The implementation fully covers the business flow: **Courier registers → PENDING → Admin reviews → APPROVE/REJECT → only APPROVED couriers can operate.**
