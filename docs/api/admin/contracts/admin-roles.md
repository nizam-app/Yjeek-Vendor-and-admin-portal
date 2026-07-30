# Admin Roles — Meta + List + Get role

Confirmed from Postman **"GET Roles meta"**, **"GET List roles"**, **"GET Get role"** + provided payloads.

## Roles meta

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/roles/meta` |
| Registry | `endpoints.admin.roles.meta` |
| Feature flag | `users` |
| UI | `/admin/users/roles/new` |

### Confirmed `data`

- `modules[]` — `{ key, label }`
- `actions[]` — `VIEW|CREATE|EDIT|DELETE|APPROVE|EXPORT`
- `scopeLevels[]` — `{ value, label }` (`GLOBAL`, `COUNTRY`, `ZONE`)
- `templates[]` — role templates with `permissions` maps

## List roles

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/roles` |
| Registry | `endpoints.admin.roles.list` |
| UI | `/admin/users/roles` |

### Confirmed `data`

```json
{
  "count": 9,
  "roles": [
    {
      "id": "…",
      "name": "Super Admin",
      "description": "Full system access",
      "scopeLevel": "GLOBAL",
      "scopeLevelLabel": "Global",
      "isSystem": true,
      "type": "System",
      "users": 1,
      "permissionsSummary": "All modules · all actions",
      "permissionsMatrix": []
    }
  ]
}
```

Empty `roles: []` is valid — UI shows “No roles found.”

## Get role

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/roles/:roleId` |
| Registry | `endpoints.admin.roles.detail(roleId)` |

Single role object (same fields as a list item). Service tolerates a mistaken list-shaped payload.

## Create role

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/roles` |
| Registry | `endpoints.admin.roles.create` |
| UI | `/admin/users/roles/new` |
| Success | `201` + role object (same shape as get role) |

### Confirmed request

```json
{
  "name": "Country Ops",
  "description": "Live dashboard + vendors view",
  "basedOnRoleId": "{{roleId}}",
  "scopeLevel": "COUNTRY",
  "permissions": {
    "LIVE_DASHBOARD": ["VIEW", "EDIT"],
    "VENDOR_MANAGEMENT": ["VIEW"],
    "REPORTS": ["VIEW", "EXPORT"]
  }
}
```

- `basedOnRoleId` omitted for “Start from scratch”
- UI sends only modules with ≥1 granted action from the checkbox matrix

### Note on `basedOnRoleId`

When `basedOnRoleId` is set, the API may **inherit** permissions for modules not listed in `permissions` from the base role (confirmed in create response vs request). Prefer scratch + explicit matrix for exact grants.

## Gaps

- `PATCH` / `DELETE` role — unwired
