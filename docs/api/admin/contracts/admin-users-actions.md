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
| UI | `/admin/users/:userId` → **Edit** → **Save changes** |

### Confirmed request sample

```json
{
  "jobTitle": "Operations Manager"
}
```

Also accepted when provided by UI: `fullName`, `phone`, `countryCode`, `roleId`, `scopeLevel`, `countries[]`, `zones[]`, `permissionOverrides`.

### Edit form fields wired

- Account: fullName, phone, countryCode, jobTitle
- Role & scope: roleId, scopeLevel, countries, zones (Status / 2FA stay read-only)
- Permissions: toggles → `permissionOverrides` (`MODULE: ["VIEW", …]`)

### Confirmed response `data` (same shape as Get user detail)

Identity: `id`, `profileId`, `fullName`, `displayName`, `initials`, `email`, `phone`, `phoneDisplay`, `countryCode`, `jobTitle`

Role: `role.{ id, name, shortName, slug, description }`

Scope: `scopeLevel`, `scopeLabel`, `countries[]`, `zones[]`

Status: `status`, `statusLabel`, `totpEnabled`, `totpLabel`, `lastActive`, `createdAt`, `createdByName`

Permissions:

- `permissions` — module → action[] map
- `permissionsMatrix[]` — `{ module, moduleLabel, view, create, edit, delete, approve, export }`
- `roleInheritedFrom`

Activity: `recentActivity[]` (`timeLabel`, `action`, `module`, `targetOrIp`, `actionType`)

UI applies the PATCH response immediately to Account info / Role & scope / Permissions / Recent activity.

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

## Resend invitation

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/users/:adminUserId/resend-invite` |
| Registry | `endpoints.admin.users.resendInvite(userId)` |
| UI | User detail → **Resend invite** (when `status === PENDING`) |

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
