# Admin Dashboard — Incidents feed

Confirmed from Postman screenshots. Real credentials, tokens, and record IDs are redacted.

## Incidents feed

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/dashboard/incidents` |
| Full URL | `{VITE_API_BASE_URL}/admin/dashboard/incidents` |
| Auth | Bearer Admin access token via shared `apiClient` |
| Registry | `endpoints.admin.dashboard.incidents` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `dashboard` |
| UI | Incidents Log on Full Overview, Live Orders, Pickup, Dine-in, Services, Scheduled |

### Success (HTTP 200) — confirmed

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "<redacted>",
        "priority": "P1",
        "status": "OPEN",
        "type": "DISPATCH_RADIUS_BROADCAST",
        "title": "Dispatch broadcast — duty manager",
        "note": "…",
        "cause": "SYSTEM",
        "stage": "RADIUS_EXPANSION",
        "reportedByCustomer": false,
        "orderId": "<redacted>",
        "orderNumber": "YJK-…",
        "vendorName": "<redacted>",
        "resolvedAt": null,
        "createdAt": "2026-07-26T11:20:02.178Z"
      }
    ]
  }
}
```

Confirmed priorities: `P1`–`P4`. Confirmed statuses: `OPEN`, `PENDING`, `RESOLVED`. `orderNumber` / `vendorName` / `note` / `stage` may be `null`.

### UI mapping

| UI | Source |
| --- | --- |
| Priority badge | `priority` → tone P1 red / P2 yellow / P3 blue / P4 gray |
| Title | `title` |
| Detail line | `#` + `orderNumber` + ` · ` + lowercase `status` (status only when no order) |
| Scheduled status badge | `OPEN`→Open, `PENDING`→Pending, `RESOLVED`→Resolved |
| Relative time | derived from `createdAt` |

### App wiring

```
useAdminIncidents
  → adminDashboardService.getIncidents
  → mapAdminIncidentsResponse
  → apiClient (scope: admin, feature: dashboard)
```

Used by: historically documented for Incidents Log. **UI now uses** [`admin-incidents-list.md`](./admin-incidents-list.md) (`GET /admin/incidents`).
