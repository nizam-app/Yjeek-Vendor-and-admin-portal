# Admin Users — Create user (invite)

Confirmed from Postman **"POST Create user (invite)"** + `201` response payload.

## Create user

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/users` |
| Registry | `endpoints.admin.users.create` |
| Feature flag | `users` |
| UI | `/admin/users/new` → **Create & invite** |

### Confirmed request

```json
{
  "fullName": "Khalid Omar",
  "email": "khalid@yjeek.com",
  "username": "khalid@yjeek.com",
  "phone": "33004455",
  "countryCode": "+973",
  "jobTitle": "Operations Manager",
  "roleId": "{{roleId}}",
  "scopeLevel": "COUNTRY",
  "countries": ["BH"],
  "zones": [],
  "permissionOverrides": {},
  "sendInvite": true
}
```

### Confirmed success `201` `data`

User detail shape (same fields as get user) plus:

- `status`: `PENDING`
- `invited`: `true`
- `invitation`: `{ status, expiresAt, sent, inviteUrl }`
- `temporaryPassword`: often `null` when invite email is sent

## UI wiring

- Loads `GET /admin/users/meta` + `GET /admin/roles` for role / country options
- Final step posts create with `sendInvite: true`
- On success → `/admin/users/:id`

## Gaps

- Permission override matrix is preview-only (body sends `permissionOverrides: {}`)
- `sendInvite: false` + `temporaryPassword` path not exposed as a separate button yet
