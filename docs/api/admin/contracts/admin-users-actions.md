# Admin Users — Update / Reset password / Suspend

Confirmed from Postman screenshots (PATCH Update user, POST Reset password, POST Suspend / Unsuspend).

Feature flag: `users`

## Update user

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Path | `/admin/users/:adminUserId` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.users.detail(userId)` |
| UI | `/admin/users/:userId` → **Edit** |

### Confirmed request sample

```json
{
  "jobTitle": "Operations Manager"
}
```

Also accepted when provided by UI: `fullName`, `phone`, `countryCode` (and optionally role/scope fields).

### Confirmed response

Same shape as **Get user detail** (`200` + full user `data`).

## Reset password

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/users/:adminUserId/reset-password` |
| Body | `{}` (omit password → auto-generate) |
| Registry | `endpoints.admin.users.resetPassword(userId)` |
| UI | User detail → **Reset password** |

### Confirmed response `data`

```json
{
  "reset": true,
  "temporaryPassword": "Yj##GwBALL5RU"
}
```

UI shows the temporary password so the admin can copy it.

## Suspend user

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/users/:adminUserId/suspend` |
| Body | none |
| Registry | `endpoints.admin.users.suspend(userId)` |
| UI | User detail → **Suspend** |

## Unsuspend user

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/users/:adminUserId/unsuspend` |
| Body | none |
| Registry | `endpoints.admin.users.unsuspend(userId)` |
| UI | User detail → **Reactivate** (when status is Suspended)

## Business rule (confirmed)

Pending invitations **cannot** be suspended or activated:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Pending invitations cannot be suspended or activated"
  }
}
```

UI disables Suspend / Reactivate when `status === PENDING`.
