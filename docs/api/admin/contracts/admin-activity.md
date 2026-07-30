# Admin Activity log

Confirmed from Postman screenshots:
- **GET Activity log** → empty `items[]` envelope
- **GET Activity filters metadata** → full `data` payload (provided)
- **GET Export activity CSV** → CSV header row

Feature flag: `users`

## Activity filters metadata

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/activity/meta` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.activity.meta` |
| UI | `/admin/users/activity` filters |

### Confirmed `data`

- `users[]`: `{ id, name, role }`
- `modules[]`: strings (e.g. `"Auth"`, `"Users & Roles"`, `"FLEET_MANAGEMENT"`)
- `actionTypes[]`: `CREATE`, `EDIT`, `DELETE`, `APPROVE`, `EXPORT`, `LOGIN`, `LOGOUT`, `OTHER`

## Activity log list

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/activity` |
| Registry | `endpoints.admin.activity.list` |
| UI | `/admin/users/activity` table |

### Confirmed query (Postman)

`search`, `module`, `actionType`, `from`, `to`, `page`, `limit`

### Confirmed success envelope

```json
{
  "total": 0,
  "page": 1,
  "limit": 50,
  "totalPages": 0,
  "hasNext": false,
  "hasPrevious": false,
  "items": []
}
```

Empty `items: []` is valid → UI shows **No activity found.**

### Gaps / inferred item fields

**No sample activity row was returned** (`items` was empty). Row mapping is inferred from:

1. User detail `recentActivity`: `id`, `time` / `timeLabel`, `action`, `module`, `actionType`, `ip`, `target` / `targetOrIp`
2. Export CSV headers: `Time`, `User`, `Action`, `Module`, `Type`, `Target`, `IP`

UI columns: Time, User, Action, Module, Type, IP — **no Target column** (CSV has Target).

**User filter:** Postman sample URL has no `userId`. UI sends `userId` from meta when a user is selected; backend may ignore until confirmed.

## Export activity CSV

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/activity/export` |
| Query | `from`, `to` (`YYYY-MM-DD`) |
| Registry | `endpoints.admin.activity.export` |
| UI | Activity log → **Export** |

### Confirmed response

CSV text. Header row:

```csv
"Time", "User", "Action", "Module", "Type", "Target", "IP"
```
