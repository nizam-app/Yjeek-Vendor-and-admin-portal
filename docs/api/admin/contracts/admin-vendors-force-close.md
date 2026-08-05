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

## FE mapping

| Modal | Sent? |
| --- | --- |
| Scope → Whole store | `scope: "whole_store"` |
| Scope → Single branch | `scope: "single_branch"` + `branchId` |
| Reason | `reason` (string) |
| From | `from` (optional ISO) |
| To | `to` (parsed to ISO) |
| Note | `note` (optional) |
| Branch | `branchId` when single branch |

### Single branch body

```json
{
  "scope": "single_branch",
  "branchId": "{{branchId}}",
  "reason": "Emergency / maintenance",
  "from": "2026-04-09T14:00:00.000Z",
  "to": "2026-04-09T18:00:00.000Z",
  "note": "kitchen maintenance"
}
```

### Success

Returns full vendor detail (same shape as Get vendor). Overview refreshes from response (`status: "Force-closed"`, `forceClosed: true`, `controls.isOnline: false`, …). For `single_branch`, only that location is closed (`operationalStatus: CLOSED`, `forceClosedUntil`).
