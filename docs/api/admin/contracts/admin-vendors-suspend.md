# Admin Vendors — Suspend / Unsuspend

Confirmed from Postman **"POST Suspend"** and **"POST Unsuspend"**.

## Suspend

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/vendors/:vendorId/suspend` |
| Body | `{ "reason": "Repeated SLA breaches" }` |
| Feature | `vendors` |
| UI | Overview → Suspend vendor → reason modal |

## Unsuspend

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/vendors/:vendorId/unsuspend` |
| Body | none |
| Feature | `vendors` |
| UI | Overview → **Unsuspend** (when status is Suspended) |

### Success

Both return full vendor detail (same shape as Get vendor). Overview refreshes from the response.
