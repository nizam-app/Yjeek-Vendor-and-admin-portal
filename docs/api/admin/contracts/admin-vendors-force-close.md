# Admin Vendors — Force close

Confirmed from Postman **"POST Force close"**.

## Force close

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/admin/vendors/:vendorId/force-close` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.vendors.forceClose` |
| Feature flag | `vendors` |
| UI | Vendor detail → Overview → Force close store |

### Body (confirmed)

```json
{
  "scope": "whole_store",
  "reason": "Hygiene inspection",
  "to": "2026-08-21T01:10:49.869Z"
}
```

### FE mapping

| Modal | Sent? |
| --- | --- |
| Scope → Whole store | `scope: "whole_store"` |
| Scope → Single branch | **Blocked** — not in confirmed API |
| Reason | `reason` (string) |
| To | `to` (parsed to ISO) |
| From / Note / Branch | **Skipped** — not in API body |

### Success

Returns full vendor detail (same shape as Get vendor). Overview refreshes from response (`status: "Force-closed"`, `forceClosed: true`, `controls.isOnline: false`, …).
