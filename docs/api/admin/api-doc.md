# Yjeek Admin Panel — Frontend API Documentation

**Audience:** Admin frontend developers / Cursor agents integrating the Ops Admin Console  
**Base URL:** `{{baseUrl}}` = `http://localhost:3000/api/v1` (local)  
**Admin prefix:** `{{baseUrl}}/admin`  
**Source of truth:** Backend `src/modules/admin-panel`  
**Related:** Postman collection `Yjeek Admin Panel`

---

## 1. Quick start

### 1.1 Auth header (all protected routes)

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Store `accessToken` after login / 2FA. Send it on every request except:

| Public route | Method |
|---|---|
| `/admin/auth/login` | POST |
| `/admin/auth/2fa/verify` | POST |
| `/admin/invitations/accept` | POST |

### 1.2 Response envelope

**Success**

```json
{
  "success": true,
  "data": { }
}
```

**Error**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | BAD_REQUEST | CONFLICT | INTERNAL_ERROR",
    "message": "Human readable message",
    "details": { }
  }
}
```

| HTTP | Typical meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Validation / bad request |
| 401 | Missing/invalid token or bad credentials |
| 403 | Authenticated but missing RBAC permission |
| 404 | Not found |
| 409 | Conflict |
| 429 | Rate limited (login / invite) |
| 500 | Server error |

**CSV exports** return raw `text/csv` (not JSON envelope):

- `GET /admin/activity/export`
- `GET /admin/reports/orders/export`
- `GET /admin/reports/dispatch-*/export`
- `GET /admin/reports/vendor-acceptance/export`

### 1.3 RBAC permissions

Permission shape from `/admin/auth/me` and login:

```ts
type AdminModule =
  | "LIVE_DASHBOARD"
  | "SCHEDULED_ORDERS"
  | "VENDOR_MANAGEMENT"
  | "STORE_MANAGEMENT"
  | "FLEET_MANAGEMENT"
  | "CUSTOMER_MANAGEMENT"
  | "MARKETING"
  | "SLA_MODELS"
  | "UI_EDITOR"
  | "USERS_ROLES"
  | "REPORTS"
  | "SETTINGS";

type AdminAction = "VIEW" | "CREATE" | "EDIT" | "DELETE" | "APPROVE" | "EXPORT";

// permissions: Partial<Record<AdminModule, AdminAction[]>>
```

Hide nav / disable buttons when the module action is missing.

### 1.4 FE route mapping (suggested)

| FE page | Primary APIs |
|---|---|
| `/login`, `/login/2fa` | Auth login, 2FA verify |
| `/dashboard/overview` | `GET /dashboard/overview`, `/map`, `/orders`, `/incidents` |
| `/dashboard/live` | `GET /dashboard/orders`, `/incidents`, `/chats` |
| `/dashboard/scheduled` | `GET /dashboard/boards/scheduled` |
| `/dashboard/pickup\|dine-in\|services` | `GET /dashboard/boards/{board}` |
| Order modal | `GET /orders/:id` + action POSTs |
| `/vendors` | Vendors list/detail/actions |
| `/fleet` | Fleet champs / suppliers / notify |
| `/customers` | Customers + segments |
| `/stores` | Prefer **store-types** APIs |
| `/users` | Users, roles, activity |
| `/sla/*` | SLA models |
| `/reports` | Reports |
| `/settings/*` | Settings sections |
| `/ui-editor/*` | UI editor |
| Topbar search / bell | `GET /search`, `/search/notifications` |

**Poll live dashboard** every 10–15s (no admin WebSocket).  
**Risk bucket query uses underscore:** `at_risk` (not `at-risk`).

---

## 2. Authentication

### Login flow

```
POST /admin/auth/login
  → if requires2fa: store tempToken → POST /admin/auth/2fa/verify
  → else: store accessToken
GET /admin/auth/me
  → hydrate profile + permissions → navigate dashboard
```

---

### `POST /admin/auth/login`

**Auth:** Public  
**FE:** `/login` form submit

**Body**

```json
{
  "email": "ops@yjeek.com",
  "password": "SuperAdmin@123",
  "deviceId": "optional-stable-device-uuid",
  "deviceName": "Chrome on Windows"
}
```

(`email` **or** `identifier` required.)

**Response — 2FA required**

```json
{
  "success": true,
  "data": {
    "requires2fa": true,
    "tempToken": "<jwt>",
    "message": "Enter the code from your authenticator app"
  }
}
```

**Response — success (no 2FA / trusted device)**

```json
{
  "success": true,
  "data": {
    "requires2fa": false,
    "user": {
      "id": "clx...",
      "email": "ops@yjeek.com",
      "phone": "+973...",
      "displayName": "Super Admin",
      "role": "Super Admin",
      "scopeLevel": "GLOBAL",
      "countries": ["BH"],
      "zones": [],
      "totpEnabled": true,
      "permissions": {
        "LIVE_DASHBOARD": ["VIEW", "EDIT", "CREATE"],
        "USERS_ROLES": ["VIEW", "CREATE", "EDIT", "DELETE", "EXPORT"]
      },
      "passwordResetRequired": false
    },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

---

### `POST /admin/auth/2fa/verify`

**Auth:** Public  
**FE:** `/login/2fa`

**Body**

```json
{
  "tempToken": "{{tempToken}}",
  "code": "123456",
  "trustDevice": true,
  "deviceId": "optional-stable-device-uuid",
  "deviceName": "Chrome on Windows"
}
```

**Response:** same shape as successful login (`user` + `accessToken` + `refreshToken`).

---

### `GET /admin/auth/me`

**Auth:** Bearer  
**FE:** App bootstrap / Account page

**Response `data` (key fields)**

```json
{
  "id": "clx...",
  "email": "ops@yjeek.com",
  "firstName": "Super",
  "lastName": "Admin",
  "displayName": "Super Admin",
  "jobTitle": "Platform Owner",
  "phone": "+973...",
  "role": "Super Admin",
  "scopeLevel": "GLOBAL",
  "countries": ["BH"],
  "zones": [],
  "status": "ACTIVE",
  "totpEnabled": true,
  "permissions": {},
  "passwordResetRequired": false,
  "lastActiveAt": "2026-07-28T12:00:00.000Z",
  "memberSince": "2026-01-01T00:00:00.000Z"
}
```

---

### `PATCH /admin/auth/me`

**Body** (at least one field)

```json
{
  "firstName": "Super",
  "lastName": "Admin",
  "jobTitle": "Platform Owner",
  "phone": "+97333000001",
  "email": "ops@yjeek.com"
}
```

---

### `POST /admin/auth/logout`

**Body:** none  
**Response**

```json
{ "success": true, "data": { "message": "Logged out successfully" } }
```

---

### `POST /admin/auth/change-password`

**Body**

```json
{
  "currentPassword": "TemporaryPass#123",
  "newPassword": "PermanentPass#456"
}
```

`newPassword` rules: min 12, upper + lower + digit + symbol.  
**Response** includes new `accessToken` / `refreshToken` (session rotated).

---

### 2FA management (Account → Security)

| Method | Path | Body |
|---|---|---|
| POST | `/admin/auth/2fa/setup` | — → `{ secret, otpauthUrl }` |
| POST | `/admin/auth/2fa/confirm` | `{ "code": "123456" }` → `{ totpEnabled, backupCodes }` |
| POST | `/admin/auth/2fa/backup-codes` | `{ "code": "123456" }` |
| POST | `/admin/auth/2fa/disable` | `{ "code": "123456", "password": "..." }` |

---

### `POST /admin/invitations/accept` (public)

```json
{
  "token": "<invite-token-from-email>",
  "password": "PermanentPass#456"
}
```

---

## 3. Live Dashboard

**Permission:** `LIVE_DASHBOARD:VIEW`  
**FE:** `/dashboard/*` — poll while tab visible

### `GET /admin/dashboard/overview`

**Query**

| Param | Default | Notes |
|---|---|---|
| `region` | `BH` | Region selector |

**Use:** KPI strip + funnel on Full Overview.

---

### `GET /admin/dashboard/map`

**Query**

| Param | Values |
|---|---|
| `layer` | `champs` \| `orders` \| `vendors` \| `zones` \| `heatmap` |
| `region` | `BH` |

---

### `GET /admin/dashboard/orders`

**Query**

| Param | Values / default |
|---|---|
| `bucket` | `all` \| `critical` \| `at_risk` \| `on_track` |
| `vendorId` | optional |
| `orderType` | `DELIVERY` \| `DINE_IN` \| `PICKUP` \| `SERVICE` |
| `fulfillmentType` | `ON_DEMAND` \| `SCHEDULED` |
| `driverId` | optional |
| `q` | search |
| `sort` | `time_left` \| `oldest` \| `newest` |
| `limit` | 1–100, default 50 |

**FE tip:** map UI hyphen `at-risk` → API `at_risk`.

---

### `GET /admin/dashboard/boards/:board`

**Path `board`:** `scheduled` \| `pickup` \| `dine_in` \| `services`  
**Query:** same as live orders (without `orderType` / `fulfillmentType`).

| FE route | board |
|---|---|
| `/dashboard/scheduled` | `scheduled` |
| `/dashboard/pickup` | `pickup` |
| `/dashboard/dine-in` | `dine_in` |
| `/dashboard/services` | `services` |

---

### `GET /admin/dashboard/incidents`

**Query:** `status=OPEN|PENDING|RESOLVED|all`, `limit=30`

### `GET /admin/dashboard/chats`

Open chat threads for live dashboard strip.

---

## 4. Orders (detail + actions)

**Permission:** `LIVE_DASHBOARD` or `SCHEDULED_ORDERS` (server picks by whether order is scheduled)  
**FE:** Global order modal / drawer

### Read APIs

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/orders/action-options` | Populate action dropdown |
| GET | `/admin/orders/:orderId` | Full detail (+ dispatch + vendorAcceptance when present) |
| GET | `/admin/orders/:orderId/print` | Print payload |
| GET | `/admin/orders/:orderId/nearby-champs` | Reassign dropdown |
| GET | `/admin/orders/:orderId/dispatch-attempts` | Dispatch evidence |
| GET | `/admin/orders/:orderId/dispatch-evaluations` | Gate evaluations |

### Action APIs (`LIVE_DASHBOARD|SCHEDULED_ORDERS:EDIT`)

#### Redispatch

```http
POST /admin/orders/:orderId/redispatch
```

```json
{
  "scope": "FULL",
  "itemIds": [],
  "reason": "Missing item remake",
  "notifyCustomer": true
}
```

`scope`: `FULL` | `PARTIAL` (`itemIds` required if PARTIAL)

#### Refund

```http
POST /admin/orders/:orderId/refund
```

```json
{
  "type": "PARTIAL",
  "amount": 1.5,
  "destination": "WALLET",
  "reason": "Missing item",
  "idempotencyKey": "admin-refund-unique-key-001"
}
```

`type`: `FULL` | `PARTIAL` · `destination`: `WALLET` | `ORIGINAL_PAYMENT`  
**Always send a unique `idempotencyKey`.**

#### Reassign champ

```http
POST /admin/orders/:orderId/reassign-champ
```

```json
{
  "driverId": "{{champId}}",
  "reason": "Original champ delayed",
  "notifyCustomer": true
}
```

#### Flag vendor

```http
POST /admin/orders/:orderId/flag-vendor
```

```json
{
  "metric": "PREP_TIME",
  "severity": "MAJOR",
  "action": "LOG_FLAG",
  "reason": "Chronic late prep",
  "notifyVendor": true
}
```

#### Cancel

```http
POST /admin/orders/:orderId/cancel
```

```json
{
  "itemDisposition": "CHAMP_KEEPS",
  "refund": "FULL",
  "cause": "VENDOR",
  "reason": "Vendor cannot fulfil"
}
```

#### Suspend champ (from order)

```http
POST /admin/orders/:orderId/suspend-champ
```

```json
{
  "type": "TEMPORARY",
  "durationHours": 24,
  "reason": "Customer complaint",
  "driverId": "{{champId}}"
}
```

#### Vendor acceptance

```http
POST /admin/orders/:orderId/vendor-acceptance/resolve
{ "note": "Dispatcher contacted vendor" }

POST /admin/orders/:orderId/vendor-acceptance/no-response
{ "note": "No vendor response", "cancelOrder": false }
```

#### Generic action

```http
POST /admin/orders/:orderId/actions
```

```json
{
  "action": "FLAG_VENDOR",
  "reason": "Late prep"
}
```

Prefer dedicated endpoints above when available.

**Success UX:** toast → close modal → refresh order + dashboard lists.

---

## 5. Incidents & Chats

**Permission:** `LIVE_DASHBOARD:VIEW` (mutations need CREATE/EDIT)

### Incidents

| Method | Path | Body / query |
|---|---|---|
| GET | `/admin/incidents/summary` | — |
| GET | `/admin/incidents` | `status`, `priority`, `limit` |
| GET | `/admin/incidents/:incidentId` | detail + `availableActions` |
| POST | `/admin/incidents` | `{ "orderId", "priority":"P2", "type":"LATE_DELIVERY", "title", "note" }` |
| POST | `/admin/incidents/:id/acknowledge` | — |
| POST | `/admin/incidents/:id/resolve` | `{ "outcome": "Resolved with refund" }` |
| POST | `/admin/incidents/:id/reopen` | — |
| POST | `/admin/incidents/:id/actions` | `{ "action", "reason" }` |

### Chats

| Method | Path | Body / query |
|---|---|---|
| GET | `/admin/chats` | `peer=all|customer|champ`, `unreadOnly`, `limit` |
| GET | `/admin/chats/:conversationId` | thread |
| POST | `/admin/chats/:conversationId/read` | mark read on open |
| POST | `/admin/chats/:conversationId/messages` | `{ "body": "Admin here — looking into your order." }` |

---

## 6. Vendors

**Permission:** `VENDOR_MANAGEMENT:VIEW` (+ CREATE/EDIT/DELETE)

### List / create / detail

```http
GET /admin/vendors?search=&status=all&category=&limit=20
```

**Response includes** `kpis` + vendor rows.

```http
POST /admin/vendors
```

Wizard body (condensed): `name`, `legalName`, `storeTypeId`, branches[], owner, commission, sla, `activate`.

```http
GET /admin/vendors/:vendorId
PATCH /admin/vendors/:vendorId
POST /admin/vendors/:vendorId/activate   { "activate": true }
PATCH /admin/vendors/:vendorId/controls  { "isOnline": true, "dispatchMode": "AUTO" }
POST /admin/vendors/:vendorId/force-close
POST /admin/vendors/:vendorId/reopen
POST /admin/vendors/:vendorId/suspend    { "reason": "..." }
POST /admin/vendors/:vendorId/unsuspend
```

**Force-close body**

```json
{
  "scope": "whole_store",
  "reason": "Hygiene inspection",
  "to": "2026-07-21T01:10:49.869Z"
}
```

### Nested resources

| Area | Paths |
|---|---|
| Branches | `GET/POST /vendors/:id/branches`, `PATCH/DELETE .../branches/:branchId` |
| Staff | `GET/POST /vendors/:id/staff`, `PATCH .../staff/:staffId` |
| Zones | `GET/PATCH /vendors/:id/delivery-zones`, `POST .../apply-all`, `PATCH .../branches/:branchId` |
| Commission | `GET/PATCH /vendors/:id/commission` |
| Promotions | CRUD `/vendors/:id/promotions` |
| SLA | `GET/PATCH /vendors/:id/sla` |

**Commission example**

```json
{ "model": "PERCENT_OF_ORDER", "commissionRate": 15 }
```

---

## 7. Fleet / Champs

**Permission:** `FLEET_MANAGEMENT:VIEW` (+ CREATE/EDIT)

```http
GET /admin/fleet/summary
GET /admin/fleet/champs?search=&statusTab=all&vehicle=BIKE&tier=GOLD&limit=20
POST /admin/fleet/champs
GET /admin/fleet/champs/:champId
PATCH /admin/fleet/champs/:champId
POST /admin/fleet/champs/:champId/online          { "online": true }
POST /admin/fleet/champs/:champId/reconcile-pod   { "note": "..." }
POST /admin/fleet/champs/:champId/messages
POST /admin/fleet/champs/:champId/suspend
POST /admin/fleet/champs/:champId/unsuspend
POST /admin/fleet/champs/:champId/terminate
GET  /admin/fleet/champs/:champId/earnings?from=&to=&limit=30
GET  /admin/fleet/champs/:champId/documents
PATCH /admin/fleet/champs/:champId/documents/:documentId  { "status": "APPROVED" }
GET  /admin/fleet/champs/:champId/sla
GET  /admin/fleet/champs/:champId/jobs?limit=20
```

**Suspend body**

```json
{
  "reason": "Document expired",
  "duration": "until_reviewed",
  "note": "Insurance renewal required"
}
```

`duration`: `until_reviewed` | `7_days` | `30_days` | `permanent`

### Suppliers

```http
GET/POST /admin/fleet/suppliers
GET/PATCH /admin/fleet/suppliers/:supplierId
POST /admin/fleet/suppliers/:id/activate
POST /admin/fleet/suppliers/:id/deactivate
```

### Notify champs

```http
POST /admin/fleet/notify/estimate   { "audience": "online" }
POST /admin/fleet/notify
GET  /admin/fleet/notify/history
```

**Notify body**

```json
{
  "audience": "online",
  "type": "Incentive",
  "title": "Peak hour bonus active!",
  "body": "Go online now — earn BHD 0.500 extra",
  "push": true,
  "sms": false
}
```

---

## 8. Customers & Segments

**Permission:** `CUSTOMER_MANAGEMENT:VIEW` (+ CREATE/EDIT/APPROVE/DELETE)

### Customers

```http
GET /admin/customers/summary
GET /admin/customers?search=&statusTab=all&limit=20
GET /admin/customers/:customerId
PATCH /admin/customers/:customerId
POST /admin/customers/:customerId/suspend
POST /admin/customers/:customerId/activate
POST /admin/customers/:customerId/reset-password
GET /admin/customers/:customerId/orders?page=1&limit=20
GET /admin/customers/:customerId/wallet?page=1&limit=20
```

**Suspend body**

```json
{
  "reason": "Fraud review",
  "duration": "until_reviewed",
  "notifyCustomer": true
}
```

### Support tickets

```http
GET  /admin/customers/:id/support
POST /admin/customers/:id/support
GET  /admin/customers/:id/support/:ticketId
PATCH /admin/customers/:id/support/:ticketId
GET  /admin/customers/:id/support/:ticketId/messages
POST /admin/customers/:id/support/:ticketId/messages  { "body": "...", "attachments": [] }
```

### Verification (APPROVE)

```http
GET  /admin/customers/:id/verification
POST /admin/customers/:id/verification/approve  { "section": "all" }
POST /admin/customers/:id/verification/reject   { "section": "id", "reason": "Unreadable document" }
```

### Withdrawals (APPROVE)

```http
GET  /admin/customers/withdrawals?status=PENDING&limit=20
POST /admin/customers/withdrawals/:id/approve
POST /admin/customers/withdrawals/:id/reject    { "reason": "..." }
POST /admin/customers/withdrawals/:id/complete  { "bankReference": "FT..." }
```

### Segments

```http
GET    /admin/segments?page=1&limit=20
POST   /admin/segments/preview
POST   /admin/segments
GET    /admin/segments/:segmentId
PATCH  /admin/segments/:segmentId
POST   /admin/segments/:segmentId/recalculate
GET    /admin/segments/:segmentId/customers
DELETE /admin/segments/:segmentId
```

**Preview / create rules example**

```json
{
  "name": "High spenders",
  "type": "DYNAMIC",
  "matchLogic": "ALL",
  "rules": [
    { "field": "total_spend", "operator": "gte", "value": 50 }
  ],
  "channels": ["PUSH", "EMAIL", "SMS"]
}
```

---

## 9. Stores catalog & Store types

**Permission:** `STORE_MANAGEMENT:VIEW`

> FE `/stores` maps to **store-types**, not product catalog.

### Catalog (`/admin/stores`)

```http
GET /admin/stores
GET /admin/stores/products?search=&limit=20
GET /admin/stores/products/:productId
PATCH /admin/stores/products/:productId
DELETE /admin/stores/products/:productId
GET /admin/stores/categories
POST /admin/stores/categories
PATCH /admin/stores/categories/:categoryId
GET /admin/stores/vendors/:vendorId/catalog
```

### Store types (`/admin/store-types`)

```http
GET /admin/store-types/summary
GET /admin/store-types
POST /admin/store-types
GET /admin/store-types/:storeTypeId
PATCH /admin/store-types/:storeTypeId
POST /admin/store-types/:id/publish
POST /admin/store-types/:id/draft
DELETE /admin/store-types/:id
```

Menu categories & badges: nested under `/store-types/:id/menu-categories` and `/badges`.

---

## 10. Marketing

**Permission:** `MARKETING:VIEW`

```http
GET /admin/marketing/summary
GET /admin/marketing/notifications/meta
GET /admin/marketing/notifications?target=all&status=all&limit=20
POST /admin/marketing/notifications/estimate
POST /admin/marketing/notifications
POST /admin/marketing/notifications/:id/resend
DELETE /admin/marketing/notifications/:id
GET /admin/marketing/promo-codes/summary
GET /admin/marketing/promo-codes
POST /admin/marketing/promo-codes
GET /admin/marketing/promo-codes/:id
PATCH /admin/marketing/promo-codes/:id
DELETE /admin/marketing/promo-codes/:id
GET /admin/marketing/banners
GET /admin/marketing/offers
```

**Send customer notification**

```json
{
  "target": "customer",
  "audience": "by_segment",
  "segmentIds": ["{{segmentId}}"],
  "type": "Promo",
  "title": "Ramadan offers",
  "body": "Up to 30% off",
  "channels": { "push": true, "sms": false, "email": true }
}
```

---

## 11. Settings

**Permission:** `SETTINGS:VIEW` / `EDIT`

```http
GET /admin/settings/meta
GET /admin/settings
PATCH /admin/settings
POST /admin/settings/reset
GET /admin/settings/general
PATCH /admin/settings/general
GET /admin/settings/localization
PATCH /admin/settings/localization
GET /admin/settings/notifications
PATCH /admin/settings/notifications
GET /admin/settings/security
PATCH /admin/settings/security
GET /admin/settings/integrations
```

**FE tabs:** `/settings`, `/settings/localization`, `/settings/notifications`, `/settings/security`, `/settings/integrations`

---

## 12. SLA Models

**Permission:** `SLA_MODELS:VIEW` (+ CREATE/EDIT/DELETE/APPROVE)

```http
GET /admin/sla-models/template
GET /admin/sla-models?active=all&status=PUBLISHED&page=1&limit=20
POST /admin/sla-models
GET /admin/sla-models/:id
PATCH /admin/sla-models/:id
DELETE /admin/sla-models/:id
POST /admin/sla-models/:id/publish
POST /admin/sla-models/:id/set-default
POST /admin/sla-models/:id/duplicate
POST /admin/sla-models/:id/rollback
POST /admin/sla-models/:id/apply
GET /admin/sla-models/:id/versions
GET /admin/sla-models/effective/:audience/:targetId
GET /admin/sla-models/compliance/:audience/:targetId
GET /admin/sla-models/breaches
PATCH /admin/sla-models/breaches/:breachId
```

`audience`: `VENDOR` | `CHAMP` | `DISPATCHER`

**Publish**

```json
{
  "note": "Approved SLA settings",
  "updateActiveAssignments": true
}
```

**Apply**

```json
{
  "vendorIds": ["{{vendorId}}"],
  "champIds": ["{{champId}}"],
  "dispatcherIds": ["{{adminUserId}}"]
}
```

---

## 13. Dispatch Rules & Automation

**Permission:** `SLA_MODELS` (same bucket)  
**FE:** pages may not exist yet — still expose APIs for future Dispatch UI

### Dispatch rules

```http
GET /admin/dispatch-rules/template
GET /admin/dispatch-rules
POST /admin/dispatch-rules                 { "name": "Bahrain stacking rules" }
GET /admin/dispatch-rules/:id
PATCH /admin/dispatch-rules/:id
POST /admin/dispatch-rules/:id/test
POST /admin/dispatch-rules/:id/simulate    { "orderIds": ["..."], "limit": 20 }
POST /admin/dispatch-rules/:id/activate    { "note": "..." }
POST /admin/dispatch-rules/:id/pause
POST /admin/dispatch-rules/:id/rollback    { "version": 1, "note": "..." }
```

### Dispatch automation (monitoring)

```http
GET /admin/dispatch-automation/overview?timezoneOffsetMin=180
GET /admin/dispatch-automation/log?section=all&limit=50
```

`section`: `all` | `acceptance` | `rule_changes` | `evaluations` | `attempts`

---

## 14. Reports

**Permission:** `REPORTS:VIEW` (exports need `EXPORT`)

```http
GET /admin/reports/overview?preset=30d
GET /admin/reports/vendors?preset=30d&limit=20
GET /admin/reports/fleet?preset=30d&limit=20
GET /admin/reports/customers?preset=30d&limit=20
GET /admin/reports/promotions?preset=30d&limit=20
GET /admin/reports/orders/meta
GET /admin/reports/orders?preset=30d&page=1&limit=10&sort=newest&status=all&sla=all
GET /admin/reports/orders/export?preset=30d&limit=100
GET /admin/reports/dispatch-evaluations/export?from=&to=&limit=500
GET /admin/reports/dispatch-attempts/export?from=&to=&limit=500
GET /admin/reports/vendor-acceptance/export?from=&to=&limit=500
```

`preset`: `7d` | `30d` | `90d` | `mtd` (or pass `from` / `to` ISO)

---

## 15. UI Editor

**Permission:** `UI_EDITOR:VIEW`

```http
GET /admin/ui-editor/apps
GET /admin/ui-editor/screen-map?app=CUSTOMER
GET /admin/ui-editor/placements?app=CUSTOMER&screen=home
GET /admin/ui-editor/preview?app=CUSTOMER&screen=home
POST /admin/ui-editor/publish                 { "app": "CUSTOMER" }
GET /admin/ui-editor/banners/meta?app=CUSTOMER
GET /admin/ui-editor/banners/targets?tapAction=OPEN_STORE
GET /admin/ui-editor/banners?app=CUSTOMER&status=all
POST /admin/ui-editor/banners
GET/PATCH/DELETE /admin/ui-editor/banners/:uiBannerId
GET /admin/ui-editor/catalog
GET /admin/ui-editor/pages?status=all
POST /admin/ui-editor/pages/ensure
GET/PUT /admin/ui-editor/pages/:slug
POST /admin/ui-editor/pages/:slug/publish
POST /admin/ui-editor/pages/:slug/unpublish
GET /admin/ui-editor/home
GET /admin/ui-editor/home/categories
POST /admin/ui-editor/home/categories
PATCH /admin/ui-editor/home/categories/reorder
PATCH /admin/ui-editor/home/categories/:categoryId
POST /admin/ui-editor/home/categories/publish
```

`app`: `CUSTOMER` | `CHAMP`

---

## 16. Users, Roles & Activity

**Permission:** `USERS_ROLES:VIEW` (+ CREATE/EDIT/DELETE/EXPORT)

### Users

```http
GET /admin/users/summary
GET /admin/users/meta
GET /admin/users?search=&page=1&limit=20
GET /admin/users/:adminUserId
POST /admin/users
PATCH /admin/users/:adminUserId
POST /admin/users/:id/reset-password
POST /admin/users/:id/resend-invite
POST /admin/users/:id/suspend
POST /admin/users/:id/unsuspend
```

**Create user**

```json
{
  "fullName": "Khalid Omar",
  "email": "khalid@yjeek.com",
  "username": "khalid@yjeek.com",
  "phone": "33004455",
  "countryCode": "+973",
  "roleId": "{{roleId}}",
  "scopeLevel": "COUNTRY",
  "countries": ["BH"],
  "zones": [],
  "sendInvite": true
}
```

### Roles

```http
GET /admin/roles/meta
GET /admin/roles
GET /admin/roles/:roleId
POST /admin/roles
PATCH /admin/roles/:roleId
DELETE /admin/roles/:roleId
```

### Activity

```http
GET /admin/activity/meta
GET /admin/activity?search=&module=&actionType=&from=&to=&page=1&limit=50
GET /admin/activity/export?from=&to=
```

---

## 17. Global search & notifications bell

**Permission:** `LIVE_DASHBOARD:VIEW`  
**FE:** `AdminLayout` topbar

```http
GET /admin/search?q=green&limit=8
```

**Response shape**

```json
{
  "success": true,
  "data": {
    "q": "green",
    "results": {
      "orders": [],
      "vendors": [],
      "champs": [],
      "customers": []
    }
  }
}
```

```http
GET /admin/search/notifications
```

Poll for bell badge / dropdown.

---

## 18. Integration checklist for frontend Cursor

1. Create `apiClient` with `baseURL = /api/v1`, attach Bearer token.
2. Auth flow: login → optional 2FA → me → store permissions.
3. Gate routes/buttons with `permissions[MODULE].includes(ACTION)`.
4. Dashboard: poll overview/orders/map/incidents/chats; use `at_risk`.
5. Order modal: get detail → nearby champs → dedicated action endpoints → refresh.
6. Treat CSV export endpoints as blob downloads.
7. Do **not** build Admin SSO / WebSocket (not available).
8. Prefer this doc + Postman for bodies; backend Zod is final validator.

---

## 19. Common IDs to pass between APIs

| From | Pass to |
|---|---|
| Login / me | `accessToken` → all protected calls |
| Login 2FA branch | `tempToken` → `/auth/2fa/verify` |
| Dashboard orders | `orderId` → `/orders/:orderId` + actions |
| Nearby champs | `driverId` / `champId` → reassign / suspend |
| Vendors list | `vendorId` → detail nested tabs |
| Fleet list | `champId` → profile tabs |
| Customers list | `customerId` → detail / support / KYC |
| Roles list | `roleId` → create user / edit role |
| Segments | `segmentId` → marketing notify audience |
| SLA / dispatch | `slaModelId`, `dispatchRuleId` |

---

## 20. Error handling UX (recommended)

| Code | FE behavior |
|---|---|
| `UNAUTHORIZED` | Clear token → redirect `/login` |
| `FORBIDDEN` | Toast “No permission” + hide control |
| `VALIDATION_ERROR` | Map `error.details` to form fields |
| `NOT_FOUND` | Toast + navigate back to list |
| `CONFLICT` | Show message, keep form open |
| Network / 500 | Generic retry toast |

---

**Document version:** 2026-07-29  
**Maintainer:** Backend (`src/modules/admin-panel`)  
**Hand off to FE:** share this file + Postman collection `Yjeek Admin Panel`
