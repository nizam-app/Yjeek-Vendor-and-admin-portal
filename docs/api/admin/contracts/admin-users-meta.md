# Admin Users — Create-user meta

Confirmed from Postman **"GET Create-user meta"** response screenshot.

## Create-user meta

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/users/meta` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.users.meta` |
| Feature flag | `users` |
| UI | `/admin/users/new` (service ready; form still uses static defaults) |

### Confirmed response shape

Module permission templates (array of module rows **or** module-keyed object), e.g.:

```json
{
  "STORE_MANAGEMENT": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": true,
    "approve": true,
    "export": true
  },
  "FLEET_MANAGEMENT": { "view": true, "create": true, "edit": true, "delete": true, "approve": true, "export": true }
}
```

Mapper also accepts `modules[]` / `permissionsMatrix[]` / nested `roles`, `countries`, `zones`, `suggestedTemporaryPassword` when present.

### Service

`adminService.getAdminUsersMeta()` → `mapAdminUsersMetaResponse`
