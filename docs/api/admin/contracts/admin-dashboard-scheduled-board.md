# Admin Dashboard — Scheduled board

Confirmed from Postman screenshots. Real credentials, tokens, and record IDs are redacted.

## Scheduled board (pipeline)

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/dashboard/boards/scheduled` |
| Full URL | `{VITE_API_BASE_URL}/admin/dashboard/boards/scheduled?sort=time_left&limit=50` |
| Auth | Bearer Admin access token via shared `apiClient` |
| Registry | `endpoints.admin.dashboard.boards.scheduled` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `dashboard` |
| UI | `/admin/scheduled` Pipeline view (+ column full pages) |

### Query parameters

| Name | Confirmed values | Notes |
| --- | --- | --- |
| `sort` | `time_left` | |
| `limit` | `50` | |

Response includes `data.bucket` (e.g. `"all"`). A `bucket` query param was not confirmed in Postman for this board.

### Success (HTTP 200) — confirmed

```json
{
  "success": true,
  "data": {
    "board": "scheduled",
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
        "category": "Hot food",
        "priorityLabel": "Critical",
        "elapsedMin": 0,
        "timeLeftLabel": "0m",
        "status": "PENDING_VENDOR_ACCEPT",
        "statusLabel": "Pending accept",
        "orderType": "DELIVERY",
        "fulfillmentType": "SCHEDULED",
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

Confirmed sample statuses include `PENDING_VENDOR_ACCEPT` and `CONFIRMED`. `champ` may be `null`. `tags` may be empty.

### UI mapping notes

- API `bucket` is SLA urgency (`critical` / `at_risk` / `on_track`), **not** the Pipeline columns (New / Awaiting champ response / …).
- Pipeline column assignment is a status heuristic in `mapAdminScheduledBoard` until the API exposes pipeline stage fields.
- Incidents + chats stay empty until those feeds are confirmed (no mock shell padding).
- Board and Calendar tabs stay empty when `VITE_ADMIN_USE_MOCK_API=false` until those views have confirmed payloads.

### App wiring

```
AdminScheduledOrdersPage / AdminScheduledColumn
  → useAdminScheduledBoard
  → adminDashboardService.getScheduledBoard
  → mapAdminScheduledBoardResponse
  → apiClient (scope: admin, feature: dashboard)
```
