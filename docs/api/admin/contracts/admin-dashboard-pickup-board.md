# Admin Dashboard — Pickup board

Confirmed from Postman screenshots. Real credentials, tokens, and record IDs are redacted.

## Pickup board

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/dashboard/boards/pickup` |
| Full URL | `{VITE_API_BASE_URL}/admin/dashboard/boards/pickup?limit=50` |
| Auth | Bearer Admin access token via shared `apiClient` |
| Registry | `endpoints.admin.dashboard.boards.pickup` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `dashboard` |
| UI | `/admin/pickup` |

### Query parameters

| Name | Confirmed values | Notes |
| --- | --- | --- |
| `limit` | `50` | |

Response includes `data.bucket` / `data.sort`. Those query params were not confirmed in Postman for this board.

### Success (HTTP 200) — confirmed

```json
{
  "success": true,
  "data": {
    "board": "pickup",
    "counts": {
      "critical": 0,
      "at_risk": 0,
      "on_track": 0,
      "all": 0
    },
    "bucket": "all",
    "sort": "time_left",
    "items": [
      {
        "id": "<redacted>",
        "orderNumber": "YJK-…",
        "bucket": "critical",
        "category": "Pickup",
        "priorityLabel": "Critical",
        "elapsedMin": 0,
        "timeLeftLabel": "0m",
        "status": "READY_FOR_PICKUP",
        "statusLabel": "Ready for pickup",
        "orderType": "PICKUP",
        "fulfillmentType": "ON_DEMAND",
        "slaBreached": true,
        "vendor": { "id": "<redacted>", "name": "<redacted>", "area": "<redacted>" },
        "champ": null,
        "hasIncident": false,
        "incidentCount": 0,
        "conversationId": null,
        "tags": []
      }
    ]
  }
}
```

Confirmed sample statuses include `READY_FOR_PICKUP`, `PREPARING`, `CONFIRMED`. `champ` may be `null`.

### UI mapping notes

- Pickup UI columns are **Incident** (red) and **On Track** (green).
- API `bucket` values map as: `critical` + `at_risk` → Incident, `on_track` → On Track.
- Card `detail` = `{statusLabel} · {champ.name|Unassigned}`.
- Incident badge only when `hasIncident` is true (no inventing).
- Incidents Log + chats stay empty until those feeds are confirmed.

### App wiring

```
AdminPickupPage
  → useAdminPickupBoard
  → adminDashboardService.getPickupBoard
  → mapAdminPickupBoardResponse
  → apiClient (scope: admin, feature: dashboard)
```
