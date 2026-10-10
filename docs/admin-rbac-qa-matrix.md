# Admin RBAC — manual QA matrix (Phase 5)

Run against **real API** (`VITE_ADMIN_USE_MOCK_API=false`, `VITE_ADMIN_REAL_API_FEATURES` includes `auth`, `dashboard`, `users`, `fleet` as needed). Restart backend after deploy.

## Personas

| Persona | Role | Scope | Test account |
|--------|------|-------|----------------|
| P0 Super Admin | Super Admin | Global | Your system admin |
| P1 Dispatcher | Dispatcher | ZONE · Manama | Dedicated test user |
| P2 Scheduled-only | Custom or edited Dispatcher | ZONE | `SCHEDULED_ORDERS: VIEW` only (optional) |

---

## P1 Dispatcher (Manama) — sign-off checklist

### Auth & session

| # | Step | Expected | ✓ |
|---|------|----------|---|
| 1 | Log in | Lands on `/admin/dashboard` (or first allowed live child), not full vendor tree | |
| 2 | `GET /admin/auth/me` (Network tab) | `permissions` includes `LIVE_DASHBOARD`, `FLEET_MANAGEMENT`, `SCHEDULED_ORDERS`; no `SETTINGS` | |
| 3 | Hard-refresh `/admin/vendors` | Forbidden page or redirect; not vendor list | |

### Navigation (UI)

| # | Step | Expected | ✓ |
|---|------|----------|---|
| 4 | Sidebar | Live Dashboard (subset), Fleet; **no** Vendors, Users, Settings, Marketing | |
| 5 | Open `/admin/scheduled` | Page loads (VIEW on scheduled or live) | |
| 6 | Open `/admin/account` | Always allowed | |

### Live dashboard API (data scope)

| # | Step | Expected | ✓ |
|---|------|----------|---|
| 7 | Overview / KPIs | Region label mentions **Manama** / Bahrain | |
| 8 | Map / live orders | No orders clearly outside Manama vendor branches (if test data exists) | |
| 9 | Open order ID outside zone (URL/API) | **404** or empty, not full other-zone detail | |

### Fleet

| # | Step | Expected | ✓ |
|---|------|----------|---|
| 10 | Fleet list | Scoped champs (zone rules per backend) | |
| 11 | **Add champ** visible | Has `FLEET_MANAGEMENT.CREATE`; category chips load via `GET /admin/fleet/champ-store-types` (no `STORE_MANAGEMENT`) | |

### Scheduled

| # | Step | Expected | ✓ |
|---|------|----------|---|
| 12 | Board loads | READ ok with `SCHEDULED_ORDERS.VIEW` | |
| 13 | Auto-assign / edit actions | Hidden or 403 without `SCHEDULED_ORDERS.EDIT` | |

### Users & roles (should deny)

| # | Step | Expected | ✓ |
|---|------|----------|---|
| 14 | `/admin/users` | Forbidden | |

---

## P0 Super Admin — smoke

| # | Step | Expected | ✓ |
|---|------|----------|---|
| 15 | Full sidebar | All modules visible per role | |
| 16 | User detail → edit Dispatcher | Countries / Zones correct; permission matrix matches role + overrides UI | |
| 17 | Clear overrides | `POST …/clear-permission-overrides` → user inherits role; re-login | |
| 18 | Edit role with assignees | Warning + confirm; assignees forced re-auth after permission change | |

---

## Regression — permission overrides data

| # | Step | Expected | ✓ |
|---|------|----------|---|
| 19 | Save user profile only (no matrix edit) | DB `permission_overrides` unchanged | |
| 20 | Change role without editing matrix | Overrides `{}` in API payload | |
| 21 | Toggle one permission | Overrides saved; amber dots on user detail | |

---

## Automated tests (CI / local)

**Backend**

```bash
cd yjeek_backend
npm run test:admin-rbac
```

**Admin portal**

```bash
cd Yjeek-Vendor-and-admin-portal
npm run test:admin-rbac
```

### Vendor delivery — Champ driver rates (branch vs template)

| # | Scenario | Expected |
|---|----------|----------|
| D1 | Single branch: save bike 0.800 / car 0.850 on branch setup | Vendor → Delivery zones: summary table + template show 0.800 / 0.850 |
| D2 | Multi-branch: different rates per branch | Summary shows one row per branch; saving one branch does not change template until push |
| D3 | Vendor template push (confirm) | All branches receive template driver rates; summary updates |

Sign-off: _______________  Date: ___________
