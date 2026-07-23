# Vendor Auth API contracts

Confirmed from Postman screenshots. Real credentials, tokens, emails, phones, and IDs are redacted.

## Login

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/vendor-panel/auth/login` |
| Full URL | `{VITE_API_BASE_URL}/vendor-panel/auth/login` |
| Auth | Public — do **not** send `Authorization` |
| Registry | `endpoints.vendor.auth.login` |

### Request body

```json
{
  "email": "<trimmed frontend email>",
  "password": "<exact frontend password>"
}
```

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "<redacted>",
      "email": "<redacted>",
      "phone": "<redacted>",
      "role": "VENDOR",
      "displayName": "<redacted>",
      "staffRole": "<redacted>",
      "vendorId": "<redacted>",
      "vendorName": "<redacted>",
      "vendorLocationId": null,
      "isGroupAdmin": true
    },
    "accessToken": "<redacted>",
    "refreshToken": "<redacted>"
  }
}
```

### Validation error (HTTP 400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Invalid email"]
    }
  }
}
```

Login UI message order: first field message → `error.message` → generic fallback.

## Get Me

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/auth/me` |
| Full URL | `{VITE_API_BASE_URL}/vendor-panel/auth/me` |
| Auth | Protected — `Authorization: Bearer <vendor access token>` via shared `apiClient` |
| Registry | `endpoints.vendor.auth.me` |
| Body | None |

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "id": "<redacted>",
    "email": "<redacted>",
    "phone": "<redacted>",
    "countryCode": "<redacted>",
    "role": "VENDOR",
    "status": "ACTIVE",
    "authProvider": "PHONE",
    "displayName": "<redacted>",
    "staffRole": "GROUP_ADMIN",
    "vendorId": "<redacted>",
    "vendorName": "<redacted>",
    "vendorLocationId": null,
    "isGroupAdmin": true
  }
}
```

## Stable frontend Vendor user mapping

Used by both Login and Get Me (`src/mappers/vendor/authMapper.js`):

| App field | Source |
| --- | --- |
| `id` | backend `id` |
| `email` | backend `email` |
| `phone` | backend `phone` |
| `countryCode` | backend `countryCode` when present, else `null` |
| `name` | backend `displayName` |
| `role` | `"vendor"` (internal) |
| `backendRole` | backend `role` |
| `status` | backend `status` when present, else `null` |
| `authProvider` | backend `authProvider` when present, else `null` |
| `staffRole` | backend `staffRole` |
| `vendorId` | backend `vendorId` |
| `vendorName` | backend `vendorName` |
| `vendorLocationId` | backend `vendorLocationId` |
| `isGroupAdmin` | backend `isGroupAdmin` |

Login does not return `countryCode`, `status`, or `authProvider` — those are stored as `null` until Get Me refreshes them.

## Token storage

| Token | Storage key | Notes |
| --- | --- | --- |
| Access token | `yjeek_vendor_access_token` | Attached by `apiClient` on protected requests |
| Refresh token | `yjeek_vendor_refresh_token` | Stored only — refresh API not implemented |
| Normalized user | `yjeek_vendor_auth` + shared `yjeek_auth` | |

## Session restoration

When `VITE_VENDOR_USE_MOCK_API=false` and a Vendor access token exists (and the active session is not Admin):

1. Set `isAuthInitializing`
2. Call `GET /vendor-panel/auth/me`
3. On success, replace stored Vendor user with the fresh normalized user
4. End initializing; route guards wait until this finishes (no login flash)

### Get Me failure

| Case | Behavior |
| --- | --- |
| `401` | Clear Vendor access token, refresh token, and Vendor session only. Admin untouched. Redirect via existing `RequireRole`. |
| Network / server error | Do **not** clear tokens. Keep stored Vendor user. Expose recoverable `authError`. Admin untouched. |

## Logout

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/vendor-panel/auth/logout` |
| Full URL | `{VITE_API_BASE_URL}/vendor-panel/auth/logout` |
| Auth | Protected — `Authorization: Bearer <vendor access token>` via shared `apiClient` |
| Registry | `endpoints.vendor.auth.logout` |
| Body | None |

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Frontend behavior

1. Vendor sidebar **Sign out** calls `AuthContext.logout()`
2. In real Vendor mode, `authService.logout()` hits the API while the access token is still present
3. Local Vendor access token, refresh token, and session are always cleared afterward (even if the API fails)
4. Admin session/storage is not cleared by Vendor Sign out
5. Existing `RequireRole` redirects to `/login`

## Modes

| Flag | Behavior |
| --- | --- |
| `VITE_VENDOR_USE_MOCK_API=true` | Vendor demo login; local Sign out only (no Logout API) |
| `VITE_VENDOR_USE_MOCK_API=false` | Real Login + Get Me + Logout |
| `VITE_ADMIN_USE_MOCK_API=true` | Admin demo unchanged |

## Unconfirmed (do not invent)

- Refresh-token endpoint and rotation
- Exact invalid-credentials / Get Me / Logout `401` response body shapes
