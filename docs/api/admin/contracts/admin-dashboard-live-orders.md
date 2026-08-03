# Admin Dashboard — Live orders

Confirmed from Postman screenshots. Real credentials, tokens, and record IDs are redacted.

## Live orders (board)

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/dashboard/orders` |
| Full URL | `{VITE_API_BASE_URL}/admin/dashboard/orders?bucket=all&sort=time_left&limit=50` |
| Auth | Bearer Admin access token via shared `apiClient` |
| Registry | `endpoints.admin.dashboard.orders` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `dashboard` |
| UI | `/admin/live-orders` board |

## Critical bucket (full view)

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/dashboard/orders` |
| Full URL | `{VITE_API_BASE_URL}/admin/dashboard/orders?bucket=critical&sort=time_left&limit=50` |
| Auth | Bearer Admin access token |
| UI | Live Orders → Critical column → full view (↗) |

Same response envelope as `bucket=all`. Confirmed `data.bucket` is `"critical"` and `items[].bucket` is `"critical"`.

At Risk / On Track full views use the same path with `bucket=at_risk` / `bucket=on_track` (same mapper; Postman critical sample confirms the pattern).

### Query parameters

| Name | Confirmed values | Notes |
| --- | --- | --- |
| `bucket` | `all`, `critical` | Also `at_risk`, `on_track` for other columns |
| `sort` | `time_left` | |
| `limit` | `50` | |

### Success (HTTP 200) — confirmed

```json
{
  "success": true,
  "data": {
    "counts": {
      "critical": 0,
      "at_risk": 0,
      "on_track": 0,
      "all": 0
    },
    "bucket": "critical",
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
        "status": "PREPARING",
        "statusLabel": "Preparing",
        "orderType": "DELIVERY",
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

`champ` may be `null`.  
`tags` may include `"Incident"`, and `"Champ"` / `"Customer"` **only when that peer has messaged** on the order conversation (not merely because a champ is assigned).  
When a Champ/Customer tag is present, `conversationId` is non-null and the UI opens `GET /admin/chats/:conversationId` in `AdminChatPanel`.

## Frontend mapping

`src/mappers/admin/mapAdminLiveOrders.js`

| UI card field | Source |
| --- | --- |
| `id` | `orderNumber` |
| `vendor` | `vendor.name` |
| `temperature` | `category` |
| `timeLeft` | `timeLeftLabel` |
| `state` | `statusLabel` |
| `hasIncident` | `hasIncident` |
| `contactType` / `contactTypes` | Champ/Customer/Vendor from `tags` (message activity only) |
| `conversationId` | Opens chat modal via `AdminChatPanel` → `GET /admin/chats/:id` |
| `rider.name` | `champ.name` or `Unassigned` |
| `schedule` | `"Scheduled"` when `fulfillmentType === "SCHEDULED"` |
| Column counts | `counts.critical` / `at_risk` / `on_track` |
| Active count | `counts.all` |

Board uses `bucket=all` with preview limit **5** per column. Column ↗ / “View all” opens full view (limit **100**).  
Critical full view refetches with `bucket=critical`.

## Not in this response

Incidents Log uses `GET /admin/dashboard/incidents`.  
Open chats uses `GET /admin/dashboard/chats`.  
Order detail modal uses `GET /admin/orders/:orderId`.

## Architecture

```
AdminLiveOrdersPage (board)
  → useAdminLiveOrders({ bucket: 'all' })

AdminLiveOrdersFullView (Critical / At Risk / On Track)
  → useAdminLiveOrders({ bucket: 'critical' | 'at_risk' | 'on_track' })
    → adminDashboardService.getLiveOrders
      → apiClient.get(endpoints.admin.dashboard.orders, { feature: 'dashboard' })
      → mapAdminLiveOrdersResponse
```

## Unconfirmed

- Incidents feed + open chats response shapes
- Order detail GET response
- Exact error bodies
