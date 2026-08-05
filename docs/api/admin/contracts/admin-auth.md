# Admin Auth API contracts

Confirmed from Postman screenshots. Real credentials, tokens, emails, phones, and IDs are redacted.

## Login

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/admin/auth/login` |
| Full URL | `{VITE_API_BASE_URL}/admin/auth/login` |
| Auth | Public — do **not** send `Authorization` |
| Registry | `endpoints.admin.auth.login` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `auth` |

### Request body

```json
{
  "email": "<trimmed frontend email>",
  "password": "<exact frontend password>"
}
```

### Success without 2FA (HTTP 200) — confirmed

```json
{
  "success": true,
  "data": {
    "requires2fa": false,
    "user": {
      "id": "<redacted>",
      "email": "<redacted>",
      "phone": "<redacted>",
      "displayName": "<redacted>",
      "role": "Super Admin",
      "scopeLevel": "GLOBAL",
      "countries": [],
      "zones": [],
      "totpEnabled": false,
      "permissions": {
        "REPORTS": ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"],
        "SETTINGS": ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"],
        "MARKETING": ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"],
        "UI_EDITOR": ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"],
        "SLA_MODELS": ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"],
        "USERS_ROLES": ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"],
        "LIVE_DASHBOARD": ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"],
        "FLEET_MANAGEMENT": ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"],
        "SCHEDULED_ORDERS": ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"],
        "STORE_MANAGEMENT": ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"],
        "VENDOR_MANAGEMENT": ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"],
        "CUSTOMER_MANAGEMENT": ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"]
      },
      "passwordResetRequired": false
    },
    "accessToken": "<redacted>",
    "refreshToken": "<redacted>"
  }
}
```

### When `requires2fa` is true

Postman includes `POST /admin/auth/2fa/verify`, but a success/error response screenshot is **not** confirmed yet.

Frontend behavior today:

1. Store a pending Admin session (including `tempToken` when present)
2. Navigate to `/admin/verify`
3. Demo 2FA code path remains until Verify is confirmed with screenshots

Do not invent the 2FA Verify response shape.

## Get Me

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/auth/me` |
| Full URL | `{VITE_API_BASE_URL}/admin/auth/me` |
| Auth | Bearer Admin access token via shared `apiClient` |
| Registry | `endpoints.admin.auth.me` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `auth` |
| UI | Session restore + `/admin/account` + sidebar identity |

### Success (HTTP 200) — confirmed fields used in UI

| App / UI | Source |
| --- | --- |
| `id` | `id` |
| `userCode` / `userId` | `userCode`, `userId` |
| `email` | `email` |
| `phone` | `phone` |
| `name` | `displayName` (fallback `fullName`) |
| `fullName` | `fullName` |
| `firstName` / `lastName` | `firstName`, `lastName` |
| `jobTitle` | `jobTitle` |
| `backendRole` / `roleBadge` | `role`, `roleBadge` |
| `scopeLevel` / `scopeLabel` | `scopeLevel`, `scopeLabel` |
| `accessLevel` | `accessLevel` |
| `countries` / `zones` | arrays |
| `status` / `statusLabel` | `status`, `statusLabel` |
| `totpEnabled` | `totpEnabled` |
| `permissions` | `permissions` object |
| `passwordResetRequired` | `passwordResetRequired` |
| `lastActiveAt` | `lastActiveAt` |
| `memberSince` | `memberSince` |
| `createdBy` / `createdById` | `createdBy`, `createdById` |
| `initials` | `initials` |

### App wiring

```
AuthProvider (boot) + AdminAccountPage
  → adminAuthService.getCurrentUser
  → mapAdminMeResponse
  → apiClient (scope: admin, feature: auth)
```

On boot, if an Admin access token exists and the stored session is not Vendor, Get Me restores the Admin user. Account page refreshes Get Me on mount.

## Logout

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/admin/auth/logout` |
| Full URL | `{VITE_API_BASE_URL}/admin/auth/logout` |
| Auth | Bearer Admin access token via shared `apiClient` |
| Registry | `endpoints.admin.auth.logout` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `auth` |
| UI | Admin sidebar Sign out + Account page Sign out |

### Request

No body.

### Success (HTTP 200) — confirmed

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### App wiring

```
AuthContext.logout (admin)
  → adminAuthService.logout
  → always clear local Admin session (even if API fails)
```

Does not clear Vendor auth/storage.

---

## Stable frontend Admin user mapping

`src/mappers/admin/authMapper.js`:

| App field | Source |
| --- | --- |
| `id` | backend `id` |
| `userCode` / `userId` | backend `userCode` / `userId` |
| `email` | backend `email` |
| `phone` | backend `phone` |
| `name` | backend `displayName` (fallback `fullName`) |
| `fullName` | backend `fullName` |
| `jobTitle` | backend `jobTitle` |
| `role` | `"admin"` (internal) |
| `backendRole` | backend `role` (e.g. `"Super Admin"`) |
| `roleBadge` | backend `roleBadge` |
| `scopeLevel` / `scopeLabel` | backend fields |
| `accessLevel` | backend `accessLevel` |
| `countries` | backend `countries` |
| `zones` | backend `zones` |
| `status` / `statusLabel` | backend fields |
| `totpEnabled` | backend `totpEnabled` |
| `permissions` | backend `permissions` |
| `passwordResetRequired` | backend `passwordResetRequired` |
| `memberSince` / `lastActiveAt` | backend ISO timestamps |
| `createdBy` | backend `createdBy` |
| `initials` | backend `initials` |

Permissions are stored for later RBAC. Sidebar/routes are unchanged in this integration beyond showing name/email/initials from Get Me.

## Token storage

| Token | Storage key | Notes |
| --- | --- | --- |
| Access token | `yjeek_admin_access_token` | Attached by `apiClient` on Admin-scoped protected requests |
| Refresh token | `yjeek_admin_refresh_token` | Stored only — refresh API not implemented |
| Normalized user | `yjeek_admin_auth` + shared `yjeek_auth` | |

Vendor tokens are cleared when a non-2FA Admin login succeeds (same portal exclusivity as demo Admin completion).

## Shared login form behavior

With `VITE_ADMIN_REAL_API_FEATURES=auth`:

1. Attempt `POST /admin/auth/login`
2. On success without 2FA → Admin dashboard
3. On credential failure (400/401/403) → fall through to Vendor login path
4. On network/server errors → surface error (do not silently try Vendor)
5. On app boot with Admin access token → `GET /admin/auth/me` restores session

With the feature flag off, the previous Admin demo + 2FA flow remains unchanged.

## Modes

| Flag | Behavior |
| --- | --- |
| `VITE_ADMIN_REAL_API_FEATURES=auth` | Real Admin Login + Get Me; other Admin screens stay on mocks when `VITE_ADMIN_USE_MOCK_API=true` |
| `VITE_ADMIN_USE_MOCK_API=true` | Non-flagged Admin features use mockClient |
| `VITE_VENDOR_USE_MOCK_API` | Unchanged — Vendor behavior independent |

## Unconfirmed (do not invent)

- Exact invalid-credentials error body
- `POST /admin/auth/2fa/verify` success/error bodies
- `PATCH /admin/auth/me` (Edit profile) response
- Refresh-token endpoint and rotation
