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
| Incidents Log rows | `GET /admin/dashboard/incidents` via `useAdminIncidents` |
| Bucket order cards | Empty until live-orders board cards are shown on this page |

## Architecture

```
AdminDashboardPage
  → useAdminDashboard
    → adminDashboardService.getDashboard
      → apiClient.get(endpoints.admin.dashboard.overview, { feature: 'dashboard' })
      → mapAdminDashboardOverviewResponse
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

- Live map layers (`GET /admin/dashboard/map`)
- Live order cards inside buckets (`GET /admin/dashboard/orders`)
- Incidents feed list (`GET /admin/dashboard/incidents`)
- Open chats (`GET /admin/dashboard/chats`)
- Exact error response bodies
