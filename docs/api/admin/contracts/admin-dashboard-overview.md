# Admin Dashboard — Overview

Confirmed from Postman screenshots. Real credentials, tokens, and record IDs are redacted.

## Overview

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/dashboard/overview` |
| Full URL | `{VITE_API_BASE_URL}/admin/dashboard/overview?region=BH` |
| Auth | Bearer Admin access token via shared `apiClient` |
| Registry | `endpoints.admin.dashboard.overview` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `dashboard` |
| UI | `/admin/dashboard` — Full Overview |

### Query parameters

| Name | Example | Notes |
| --- | --- | --- |
| `region` | `BH` | Matches Postman sample; topbar label may show `Bahrain · All regions` |

### Success (HTTP 200) — confirmed

```json
{
  "success": true,
  "data": {
    "region": "Bahrain - All regions",
    "kpis": {
      "pending": 0,
      "accepted": 0,
      "preparing": 0,
      "ready": 0,
      "pickedUp": 0,
      "delivered": 0,
      "cancelled": 0,
      "onlineVendor": 0,
      "onlineChamp": 0
    },
    "activeOrders": 0,
    "buckets": {
      "critical": 0,
      "at_risk": 0,
      "on_track": 0
    },
    "openIncidents": 0,
    "autoRefreshSeconds": 3
  }
}
```

## Frontend mapping

`src/mappers/admin/mapAdminDashboardOverview.js`

| UI | Source |
| --- | --- |
| KPI strip (Pending → Online Champ) | `data.kpis.*` |
| Critical / At Risk / On Track counts | `data.buckets.critical` / `at_risk` / `on_track` |
| Auto-refresh interval | `data.autoRefreshSeconds` |
| Live map | Separate `GET /admin/dashboard/map` (empty if layer not confirmed) |
| Incidents Log rows | `GET /admin/incidents` via `useAdminIncidents` |
| Bucket order cards (recent 2) | `GET /admin/dashboard/orders?bucket=critical\|at_risk\|on_track&sort=time_left&limit=2` |

Preview fetches do **not** send `region` (Postman live-orders uses `bucket` / `sort` / `limit` only). Overview stays region-scoped via `/overview?region=BH`. Each bucket is loaded with `Promise.allSettled` so one failure does not clear the others.

### Card fields (from live-order item)

| UI | Source |
| --- | --- |
| Order id | `orderNumber` (fallback `id`) |
| Time left | `timeLeftLabel` (fallback `elapsedMin` → `Nm`) |
| Detail line | `vendor.name` · `vendor.area` · `category` · `statusLabel` |
| Incident pill | `hasIncident` |

If any of those item fields are missing, the card still renders with `—` placeholders.

## Architecture

```
AdminDashboardPage
  → useAdminDashboard
    → adminDashboardService.getDashboard
      → GET /admin/dashboard/overview
      → GET /admin/dashboard/orders?bucket=critical|at_risk|on_track&limit=2  (bucket cards)
      → mapAdminDashboardOverviewResponse + attachOverviewBucketOrderPreviews
```

## Modes

| Flag | Behavior |
| --- | --- |
| `VITE_ADMIN_REAL_API_FEATURES` includes `dashboard` | Real overview KPIs + bucket counts |
| `VITE_ADMIN_USE_MOCK_API=true` | Non-flagged Admin screens stay on mockClient |
| Feature flag off | Full Overview uses existing mock `/admin/dashboard` |

Recommended `.env` while integrating:

```env
VITE_ADMIN_USE_MOCK_API=true
VITE_ADMIN_REAL_API_FEATURES=auth,dashboard
```

Do **not** set `VITE_ADMIN_USE_MOCK_API=false` unless you accept that unwired Admin screens will call the real backend (or show empty) instead of mocks.

## Unconfirmed (do not invent)

- Live map layers beyond confirmed `layer=champs` (and empty-safe others)
- Exact error response bodies

## Wired follow-ups

- Bucket order cards: `GET /admin/dashboard/orders` with `limit=2` per bucket (same mapper as Live Orders)
- Incidents Log: `GET /admin/incidents`
- Open chats: separate chats strip (when on Live Orders)