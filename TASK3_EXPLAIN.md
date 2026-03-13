# TASK 3 - Merchant Product Flow and B2C Display (Explanation)

The goal of Task 3 was to complete the full product and order flow:

- Merchant Owner logs in to Front Management.
- Merchant Owner can create, update, and delete products in their own store.
- Active products are shown in the B2C storefront.
- Users can browse products, add them to cart, checkout, and create orders.
- The system assigns an eligible courier to handle the order.

## 1. What Was Implemented

### Backend Requirements

- Merchant must be APPROVED before creating products (Must Have): DONE.

  - We enforced this with `ResourceStatusGuard` and status checks on product creation.

- API must validate MERCHANT_OWNER role (Must Have): DONE.

  - Role and permission checks are enforced in backend guards and ownership validation.

- Merchant Owners can only create products for their own store (Must Have): DONE.

  - Merchant ID is bound from authenticated user context for merchant users.
  - The merchant flow does not rely on merchantId from query/body for owner users.
  - Added `GET /api/products/merchant/me` to return products from the correct store.

- Pagination for product listing APIs (Must Have): DONE.

  - Main list endpoints now return pagination metadata with `data` and `meta`.
  - Includes:
    - `GET /api/products`
    - `GET /api/products/merchant/:merchantId`
    - `GET /api/products/merchant/me`
    - `GET /api/products/public`

- Only APPROVED and ONLINE couriers are eligible (Must Have): DONE.

  - Eligibility is enforced with approved status and online-compatible statuses (`ONLINE` or `AVAILABLE`).

- Nearest courier selection on order creation (Nice to Have): NOT DONE.

  - Current logic still picks the first eligible courier.

- Product status DRAFT / PUBLISHED / ARCHIVED (Nice to Have): NOT DONE.

  - Current flow still uses `isActive`.

- Full-text search (Nice to Have): NOT DONE.

  - This needs dedicated indexing and search design.

- Caching (Redis) for product listings (Nice to Have): NOT DONE.

  - This needs caching infrastructure and invalidation strategy.

- Geo-indexing/PostGIS for courier selection (Nice to Have): NOT DONE.
  - This needs schema migration and geospatial query strategy.

### Frontend Requirements - Merchant Management

- Merchant Owner can add products (Must Have): DONE.
- Merchant Owner can update products (Must Have): DONE.
- Merchant Owner can delete products (Must Have): DONE.
- Product Management page for merchant products (Must Have): DONE.
- Product form includes name, description, price, images, category (Must Have): DONE.
- Product management routes configured in app.routes.ts (Must Have): DONE.

Additional implemented details:

- Routes are available for:
  - `/products/list`
  - `/products/create`
  - `/products/edit/:id`
- Product form supports required category validation.
- Merchant flow uses merchant context, so UI does not need manual merchantId input.

Nice to Have status:

- Multiple image upload: DONE.
- Drag-and-drop upload: NOT DONE.
- Pagination in product lists: DONE.
- Publish/Unpublish toggle: NOT DONE.
- Product preview before publish: NOT DONE.

### Frontend Requirements - B2C Storefront

- Product listing page (Must Have): DONE.
- Product detail page (Must Have): DONE.
- Add to cart (Must Have): DONE.
- Order creation flow (Must Have): DONE.

Nice to Have status:

- Skeleton loading while fetching: DONE.
- State management: DONE.
- Lazy-loaded routes: DONE.
- Basic SEO optimization (title/meta/url): DONE.

### Pattern and Architecture Alignment

The implementation follows existing project patterns:

- Controller + Guard + Permission decorators for access control.
- DTO validation at API boundaries.
- Service layer for business logic, ownership checks, and pagination.
- Shared contracts/services for both Front Management and B2C.

Cross-module conventions were kept consistent:

- Unified pagination contract: `data` + `meta`.
- Ownership checks are enforced in backend, not trusted on UI.
- Merchant and admin-like flows are clearly separated.

### Testing and Verification

Unit tests:

- Full dedicated unit test coverage for all Task 3 changes is not added yet.

Planned test backlog:

- Product ownership integration tests.
- Front Management product form/list component tests.
- B2C cart/checkout state tests.

Manual testing performed:

- Merchant login and Product Management access.
- Product creation using merchant context without manual merchantId.
- Required category validation on create form.
- Edit/delete with ownership enforcement.
- Pagination and merchant filter verification on product APIs.
- B2C list/detail/cart/checkout/order creation flow.
- Courier assignment for approved + online-compatible couriers.

Build/compile verification:

- Type checks for `api-service` and `front-management` passed.
- Backend build passed.

## 2. Why These Decisions Were Made

### Main Design Decisions

- Why bind merchant by authenticated user context:

  - Prevents clients from sending another store's merchantId.
  - Makes ownership boundaries enforced safely in backend.

- Why add `merchant/me` endpoints:

  - Makes merchant flow clearer and easier to use.
  - Reduces coupling to query parameters in frontend.

- Why keep one pagination contract:

  - APIs are consumed by multiple apps (management + storefront).
  - Consistent response shape reduces integration bugs.

- Why category handling was done this way:
  - It satisfies Must Have within time constraints.
  - Keeps impact low on stable existing domain/schema.

### Security and Stability

- Ownership and permissions are enforced in backend.
- Merchant approval status is checked before product creation.
- Courier eligibility rules are explicit and controlled.
- Compile/build checks were run after changes to reduce regressions.

### Trade-offs and Remaining Nice to Have Items

Not completed yet:

- Nearest courier logic:

  - Needs distance algorithm, ranking strategy, and performance checks.

- Product lifecycle states (DRAFT/PUBLISHED/ARCHIVED):

  - Needs domain/model updates, UI state flow, and migrations.

- Full-text search:

  - Needs indexing strategy and query optimization.

- Redis caching:

  - Needs cache key design and invalidation policy for create/update/delete.

- Geo-indexing/PostGIS:
  - Needs geospatial data migration and query design.

Reason for current priority:

- Complete 100% Must Have items first.
- Make core flow stable and safe to merge.
- Avoid partial Nice to Have implementations that create technical debt.
