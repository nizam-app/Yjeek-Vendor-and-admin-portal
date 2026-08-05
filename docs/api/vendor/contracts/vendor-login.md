# Vendor Login API contract

Confirmed from Postman screenshots. Real credentials, tokens, emails, and phone numbers are redacted.

## Endpoint

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/vendor-panel/auth/login` |
| Full URL | `{VITE_API_BASE_URL}/vendor-panel/auth/login` |
| Auth | Public — do **not** send `Authorization` |
| Registry | `endpoints.vendor.auth.login` |

Base URL comes only from `VITE_API_BASE_URL` (example local value is documented in `.env.example`). Never hardcode the host or `/api/v1` in source.

## Request body

```json
{
  "email": "<trimmed frontend email>",
  "password": "<exact frontend password>"
}
```

Rules:

- Send the actual form values (never Postman variables like `{{vendorEmail}}`).
- Trim `email` only.
- Do not trim or modify `password`.

## Success response (HTTP 200)

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

### Frontend user mapping

| App field | Source |
| --- | --- |
| `accessToken` | `data.accessToken` |
| `refreshToken` | `data.refreshToken` |
| `user.id` | `data.user.id` |
| `user.email` | `data.user.email` |
| `user.phone` | `data.user.phone` |
| `user.name` | `data.user.displayName` |
| `user.role` | `"vendor"` (internal) |
| `user.backendRole` | `data.user.role` |
| `user.staffRole` | `data.user.staffRole` |
| `user.vendorId` | `data.user.vendorId` |
| `user.vendorName` | `data.user.vendorName` |
| `user.vendorLocationId` | `data.user.vendorLocationId` |
| `user.isGroupAdmin` | `data.user.isGroupAdmin` |

### Token storage

| Token | Storage key |
| --- | --- |
| Access token | `yjeek_vendor_access_token` |
| Refresh token | `yjeek_vendor_refresh_token` |
| Normalized user payload | `yjeek_vendor_auth` + shared `yjeek_auth` |

Refresh token is stored only. Automatic refresh is **not** implemented until the refresh endpoint is confirmed.

## Validation error response (HTTP 400)

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

Login UI message fallback order:

1. First field validation message (`email`, then `password`, then any other field)
2. `error.message`
3. Normalized generic API / login fallback message

## Unresolved (do not invent)

- Invalid-credentials response shape (likely 401) — not confirmed from screenshots
- `GET` Get me
- `POST` Logout
- Refresh-token endpoint and rotation behavior

## Integration notes

- Vendor real login runs when `VITE_VENDOR_USE_MOCK_API=false`
- Vendor demo login remains when `VITE_VENDOR_USE_MOCK_API=true`
- Admin panel stays on mock auth / mock data (`VITE_ADMIN_USE_MOCK_API=true`)
- Failed Vendor login must not clear Admin session storage
- Login `401` with `skipAuth` must not trigger unauthorized session clear / redirect loop
