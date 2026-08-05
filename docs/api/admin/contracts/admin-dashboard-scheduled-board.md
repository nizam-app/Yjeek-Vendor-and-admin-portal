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

### Success (HTTP 200) — confirmed fields

| Field | Notes |
| --- | --- |
| `pipelineCounts` | `{ new, awaiting_champ_response, awaiting_champ_confirmation, confirmed }` |
| `counts` | SLA buckets `critical` / `at_risk` / `on_track` / `all` |
| `items[].pipelineColumn` | Pipeline stage — **source of truth for column placement** |
| `items[].actions` | e.g. `ASSIGN_DATE_TIME_CHAMP`, `REMIND_CHAMP`, `REASSIGN_CHAMP`, `FORCE_PICKUP_NOW` |
| `items[].banner` | `{ tone, text }` or `null` |
| `items[].windowLabel` | Delivery window label for the card |
| `items[].status` / `statusLabel` | Order status display |
| `items[].vendor` / `champ` | Nested refs; `champ` may be `null` |
| `items[].tags` | Display chips |

### `pipelineColumn` → UI column key

| API `pipelineColumn` | UI key |
| --- | --- |
| `new` | `new` |
| `awaiting_champ_response` | `response` |
| `awaiting_champ_confirmation` | `confirmation` |
| `confirmed` | `confirmed` |

Do **not** place cards using SLA `bucket` or a status-only heuristic when `pipelineColumn` is present.

### UI mapping notes

- API `bucket` is SLA urgency (`critical` / `at_risk` / `on_track`), **not** the Pipeline columns.
- Status heuristic remains only as fallback when `pipelineColumn` is missing.
- Incidents + chats stay empty until those feeds are confirmed (no mock shell padding).
- Board tab reuses the same `GET …/boards/scheduled` items as a dispatch table (not a separate board API).
- Calendar tab stays empty/mock when `VITE_ADMIN_USE_MOCK_API=false` until that view has a confirmed payload.

### App wiring

```
AdminScheduledOrdersPage / AdminScheduledColumn
  → useAdminScheduledBoard
  → adminDashboardService.getScheduledBoard
  → mapAdminScheduledBoardResponse
  → apiClient (scope: admin, feature: dashboard)
```
