# Admin Fleet — KPI summary

Confirmed from Postman **"GET Fleet KPI summary"** response screenshot.

## Fleet KPI summary

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/fleet/summary` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.fleet.summary` |
| Feature flag | `fleet` |
| UI | `/admin/fleet` — KPI cards |

### Confirmed success `data`

```json
{
  "totalChamps": 1,
  "onlineNow": 0,
  "onDelivery": 1,
  "avgRating": 0,
  "suspended": 0,
  "terminated": 0
}
```

### UI mapping

| KPI card | Source |
| --- | --- |
| Total champs | `totalChamps` |
| Online now | `onlineNow` |
| On delivery | `onDelivery` |
| Avg rating (★) | `avgRating` (1 decimal) |
| Suspended | `suspended` |

### Gaps

- **`terminated`** is returned by the API but there is **no Terminated KPI card** in the Champs UI — value is kept on `summary.terminated` for later use.
- Champs table is wired separately — see [`admin-fleet-champs-list.md`](./admin-fleet-champs-list.md).

## App wiring

```
AdminFleetPage
  → adminService.getAdminFleetSummary
  → adminFleetService.getFleetSummary
  → GET /admin/fleet/summary
  → mapAdminFleetSummaryResponse
```
