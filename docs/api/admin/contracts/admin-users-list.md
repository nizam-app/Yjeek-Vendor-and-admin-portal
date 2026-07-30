# Admin Users — List + summary

Confirmed from Postman **"GET List users"** and **"GET Users summary"** response screenshots.

## List users

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/users` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.users.list` |
| Feature flag | `users` |
| UI | Users & Roles → **Users** tab |

### Confirmed query

`search`, `page`, `limit` (Postman default `page=1&limit=20`)

Optional filter params sent by UI when selected: `roleId`, `country`, `status` (backend may ignore).

### Confirmed success `data`

```json
{
  "summary": {
    "total": 1,
    "active": 1,
    "pending": 0,
    "suspended": 0,
    "roles": 9
  },
  "page": 1,
  "limit": 20,
  "total": 1,
  "totalPages": 1,
  "filters": {
    "roles": [{ "id": "…", "name": "Admin" }],
    "countries": [{ "code": "BH", "name": "Bahrain" }],
    "statuses": [{ "value": "ACTIVE", "label": "Active" }]
  },
  "users": [
    {
      "id": "…",
      "fullName": "Super Admin (You)",
      "displayName": "Super Admin",
      "isYou": true,
      "email": "ops@yjeek.com",
      "role": { "id": "…", "name": "Super Admin", "shortName": "Super Admin", "slug": "super-admin" },
      "scopeLabel": "Global",
      "status": "ACTIVE",
      "statusLabel": "Active",
      "totpEnabled": false,
      "totpLabel": "Off",
      "lastActive": "now"
    }
  ]
}
```

Empty `users: []` is valid — UI shows “No users found.” (do not invent rows).

## Users summary

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/users/summary` |
| Registry | `endpoints.admin.users.summary` |

### Confirmed success `data`

```json
{
  "total": 1,
  "active": 1,
  "pending": 0,
  "suspended": 0,
  "roles": 9
}
```

List response already embeds `summary` for KPI cards; dedicated summary endpoint is available via `adminService.getAdminUsersSummary`.

## UI mapping

| UI | Source |
| --- | --- |
| Total users / Active / Roles / Suspended | `data.summary` |
| Role / Country / Status dropdowns | `data.filters` |
| Table rows | `data.users` |
| Search | query `search` |

## Gaps

- (Historical) list contract only — Roles + Activity + user actions are wired separately under their own contracts
