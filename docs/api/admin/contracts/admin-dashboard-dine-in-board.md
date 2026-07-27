# Admin Dashboard — Dine-in board

Confirmed from Postman screenshots. Real credentials, tokens, and record IDs are redacted.

## Dine-in board

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/dashboard/boards/dine_in` |
| Full URL | `{VITE_API_BASE_URL}/admin/dashboard/boards/dine_in?limit=50` |
| Auth | Bearer Admin access token via shared `apiClient` |
| Registry | `endpoints.admin.dashboard.boards.dineIn` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `dashboard` |
| UI | `/admin/dine-in` |

### Query parameters

| Name | Confirmed values | Notes |
| --- | --- | --- |
| `limit` | `50` | |

### Success (HTTP 200) — confirmed

```json
{
  "success": true,
  "data": {
    "board": "dine_in",
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
        "category": "Dine-in",
        "priorityLabel": "Critical",
        "elapsedMin": 0,
        "timeLeftLabel": "0m",
        "status": "CONFIRMED",
        "statusLabel": "Accepted",
        "orderType": "DINE_IN",
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

### UI mapping notes

Same IncidentBoard layout as Pickup:
- `critical` + `at_risk` → **Incident**, `on_track` → **On Track**
- Card `detail` = `{statusLabel} · {champ.name|Unassigned}`
- Incidents Log + chats stay empty until those feeds are confirmed

### App wiring

```
AdminDineInPage
  → useAdminDineInBoard
  → adminDashboardService.getDineInBoard
  → mapAdminDineInBoardResponse
  → apiClient (scope: admin, feature: dashboard)
```
