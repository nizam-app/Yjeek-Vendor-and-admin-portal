# Admin Users — Get user detail

Confirmed from Postman **"GET Get user detail"** response screenshot + provided payload.

## Get user detail

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/users/:adminUserId` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.users.detail(userId)` |
| Feature flag | `users` |
| UI | `/admin/users/:userId` |

### Confirmed success `data` (key fields)

- Identity: `id`, `profileId`, `fullName`, `displayName`, `initials`, `isYou`, `email`, `phoneDisplay`, `jobTitle`
- Role: `role.{ id, name, shortName, slug, description }`
- Scope: `scopeLevel`, `scopeLabel`, `countries[]`, `zones[]`
- Status: `status`, `statusLabel`, `totpEnabled`, `totpLabel`, `lastActive`, `lastActiveAt`, `createdAt`, `createdByName`
- Permissions: `permissionsMatrix[]` (`module`, `moduleLabel`, `view/create/edit/delete/approve/export`)
- Activity: `recentActivity[]` (`timeLabel`, `action`, `module`, `targetOrIp`)
- `roleInheritedFrom`

Empty `recentActivity: []` / empty matrix is valid — show empty states.

## UI gaps still unwired

- Resend invitation (`POST …/resend-invite`) — service ready, no dedicated button yet
