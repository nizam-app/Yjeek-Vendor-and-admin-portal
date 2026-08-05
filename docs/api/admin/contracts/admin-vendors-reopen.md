# Admin Vendors — Reopen (Resume)

Confirmed from Postman **"POST Reopen"**.

## Reopen

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/admin/vendors/:vendorId/reopen` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.vendors.reopen` |
| Feature flag | `vendors` |
| UI | Vendor detail → Overview → **Resume** (shown when force-closed) |

### Body (confirmed)

```json
{
  "scope": "whole_store"
}
```

### Single branch

```json
{
  "scope": "single_branch",
  "branchId": "{{branchId}}"
}
```

### Success

Returns full vendor detail (same shape as Get vendor). Overview updates: `status: "Active"`, `forceClosed: false`, online on, KPIs, and the button switches back to **Force close store**. For `single_branch`, that location is set back to `OPEN`.
