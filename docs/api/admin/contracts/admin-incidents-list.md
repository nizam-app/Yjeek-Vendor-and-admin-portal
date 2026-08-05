# Admin Incidents — List incidents

Confirmed from Postman response screenshot. Real credentials and IDs are redacted in docs.

## List incidents

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/incidents` |
| Query | `status=all`, `priority=all`, `limit=50` (confirmed defaults) |
| Full URL | `{VITE_API_BASE_URL}/admin/incidents?status=all&priority=all&limit=50` |
| Auth | Bearer Admin access token via shared `apiClient` |
| Registry | `endpoints.admin.incidents.list` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `dashboard` |
| UI | Incidents Log (Overview, Live Orders, Pickup/Dine-in/Services, Scheduled) |

### Success (HTTP 200) — confirmed `data` shape

| Field | Notes |
| --- | --- |
| `page`, `limit`, `total` | Pagination |
| `summary.open` / `pending` / `resolved` / `criticalOpen` / `totalOpen` | Counts |
| `items[]` | Incident rows |

### Confirmed item fields used in UI

| UI | Source |
| --- | --- |
| Priority badge | `priorityLabel` / `priority` (`P1`–`P4`) |
| Title | `title` |
| Detail | `#` + `orderNumber` + ` · ` + lowercase `statusLabel` (status only when no order) |
| Status badge (scheduled log) | `statusLabel` (`Open` / `Pending` / `Resolved`) |
| Relative time | `createdLabel` when present, else derived from `createdAt` |

Also stored for later detail/actions: `id`, `orderId`, `note`, `cause`, `stage`, `vendorName`, `champName`, `metadata`, etc. Nullable fields stay null — no invented values.

### App wiring

```
useAdminIncidents
  → adminIncidentService.list({ status: 'all', priority: 'all', limit: 50 })
  → mapAdminIncidentsResponse
  → apiClient (scope: admin, feature: dashboard)
```

Replaces the earlier dashboard feed (`GET /admin/dashboard/incidents`) for Incidents Log panels.
