# Admin RBAC

## Module keys (source of truth)

| Layer | Location |
|-------|----------|
| Backend | `yjeek_backend/src/modules/admin-panel/shared/permissions.ts` |
| Frontend | `Yjeek-Vendor-and-admin-portal/src/config/adminModules.js` |

Modules: `LIVE_DASHBOARD`, `SCHEDULED_ORDERS`, `VENDOR_MANAGEMENT`, `STORE_MANAGEMENT`, `FLEET_MANAGEMENT`, `CUSTOMER_MANAGEMENT`, `MARKETING`, `SLA_MODELS`, `UI_EDITOR`, `USERS_ROLES`, `REPORTS`, `SETTINGS`.

Actions: `VIEW`, `CREATE`, `EDIT`, `DELETE`, `APPROVE`, `EXPORT`.

Effective permissions = role JSON merged with `admin_profiles.permission_overrides` (empty override action lists are ignored on the server).

## Frontend building blocks (Phase 1)

| File | Purpose |
|------|---------|
| `src/lib/adminPermissions.js` | `hasAdminPermission`, `adminUserCan`, `adminUserMeetsRouteRequirement` |
| `src/hooks/useAdminCan.js` | React hook for pages (Phase 2 guards) |
| `src/config/adminNavManifest.js` | Sidebar entries, route prefixes, page titles, `firstAllowedAdminPath` |

**Automation** in the UI maps to backend `SLA_MODELS.VIEW` (`/admin/dispatch-automation`).

## Route access (VIEW unless noted)

| Path prefix | Permission |
|-------------|------------|
| `/admin/dashboard`, `/admin/live-orders`, `/admin/pickup`, `/admin/dine-in`, `/admin/services` | `LIVE_DASHBOARD.VIEW` |
| `/admin/scheduled` | `LIVE_DASHBOARD.VIEW` **or** `SCHEDULED_ORDERS.VIEW` |
| `/admin/vendors` | `VENDOR_MANAGEMENT.VIEW` |
| `/admin/stores` | `STORE_MANAGEMENT.VIEW` |
| `/admin/fleet` | `FLEET_MANAGEMENT.VIEW` |
| `/admin/customers` | `CUSTOMER_MANAGEMENT.VIEW` |
| `/admin/marketing` | `MARKETING.VIEW` |
| `/admin/sla-models`, `/admin/automation` | `SLA_MODELS.VIEW` |
| `/admin/ui-editor` | `UI_EDITOR.VIEW` |
| `/admin/users` | `USERS_ROLES.VIEW` |
| `/admin/reports` | `REPORTS.VIEW` |
| `/admin/settings` | `SETTINGS.VIEW` |
| `/admin/account` | (authenticated admin; no module) |

Order **mutations** use `LIVE_DASHBOARD` vs `SCHEDULED_ORDERS` based on whether the order is scheduled (`admin-orders.routes.ts`).

Scheduled **calendar** API: `GET /admin/dashboard/boards/scheduled/calendar` accepts either `LIVE_DASHBOARD.VIEW` or `SCHEDULED_ORDERS.VIEW`.

## Data scope (zone / country)

| Domain | Scoped? | Helper |
|--------|---------|--------|
| Fleet | Yes | `admin-fleet.service` |
| Customers | Yes | `admin-customers.service` |
| Orders / dashboard | **Done (Phase 3)** | `admin-dashboard.service.ts` (overview, live, map, scheduled, incidents feed, open chats); `admin-orders.service.ts` (`guardOrderScope` / `assertOrderInAdminScope` on reads + mutations) |
| Incidents | **Done (Phase 3)** | `admin-incidents.service.ts` (`withIncidentScope` on list/summary; `assertIncidentInAdminScope` on get + mutations) |

ZONE admins: orders match `vendorLocation.city` / `area` ∈ `admin.zones` (fallback: any vendor branch in zone).

## Local dev: real API vs mocks

Hybrid mock mode can show a map shell while dashboard KPIs call the real API and return 403 if permissions are missing.

For RBAC testing:

- `VITE_ADMIN_USE_MOCK_API=false` and `VITE_API_BASE_URL` pointing at your backend, or
- `VITE_ADMIN_REAL_API_FEATURES=auth,dashboard,users,fleet` (include every feature you exercise).

See `.env.example`.

## Fixing a user locked out of Live Dashboard

1. Super Admin → Users → user detail → confirm role (e.g. Dispatcher) and matrix shows `LIVE_DASHBOARD` View.
2. If overrides were saved by mistake: edit user, change role and save (clears overrides) or re-save permissions intentionally.
3. User re-logs in after `auth_version` bump.

## Frontend enforcement (Phase 2)

- Sidebar and deep links use `adminNavManifest.js` + `filterAdminNavForUser`.
- Routes under `/admin/*` (except `/admin/account`) go through `AdminPermissionOutlet`.
- Denied access shows `AdminForbiddenPage` with “Go to your home” (`firstAllowedAdminPath`).
- Post-login redirect: `/admin` → `AdminIndexRedirect`.

## User PATCH semantics (portal)

`AdminUserDetailPage` sends `permissionOverrides` only when permission checkboxes were toggled, or `{}` when the role changes without custom permissions—never on profile-only saves.

## Users & Roles UX (Phase 4)

**API (user detail)**

- `rolePermissions` + `permissionsMatrixRole` — inherited from role.
- `permissionOverrides` + `hasCustomPermissionOverrides` — per-user deltas.
- `permissions` / `permissionsMatrix` — effective (merged) grants.
- `POST /admin/users/:id/clear-permission-overrides` — sets overrides to `{}`, bumps `auth_version`, clears trusted devices.

**User detail UI**

- Amber dot on permission cells that differ from the role default.
- Banner + **Reset to role defaults** when `hasCustomPermissionOverrides`.
- **Countries** vs **Zones** on ZONE scope: countries show ISO names (e.g. Bahrain); zones show city list; list `scopeLabel` is `Bahrain · Manama` for zone dispatchers.

**Role edit UI**

- Info banner when the role has assigned users; confirm on save that all assignees are affected (overrides on individuals are unchanged until cleared).

## Testing & QA (Phase 5)

| Layer | Command | Files |
|-------|---------|--------|
| Backend RBAC | `npm run test:admin-rbac` (in `yjeek_backend`) | `admin-rbac-core`, `admin-rbac-policy`, `admin-rbac-dispatcher-persona`, `admin-ops-zone-scope` |
| Portal RBAC | `npm run test:admin-rbac` (in `Yjeek-Vendor-and-admin-portal`) | `admin-rbac-portal` (+ `permissionOverrideMap.js`) |
| Manual sign-off | [admin-rbac-qa-matrix.md](./admin-rbac-qa-matrix.md) | Dispatcher Manama + Super Admin smoke |

Backend CI (`npm run check` on PR) runs the full test suite including RBAC tests.

## Rollout & ops (Phase 6)

| Item | Location |
|------|----------|
| Ops scope kill switch | `ADMIN_OPS_ZONE_SCOPE_ENABLED` (API env, default on) |
| Runtime probe | `GET /admin/auth/me` → `serverCapabilities.opsZoneScopeEnforced` |
| 403 audit logs | JSON `admin_access_denied` on stderr for `/admin/*` 403s |
| Post-deploy smoke | `cd yjeek_backend && npm run smoke:admin-rbac` |
| Runbook | [admin-rbac-runbook.md](./admin-rbac-runbook.md) |
