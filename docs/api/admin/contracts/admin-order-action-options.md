# Admin Orders — Action options + take action

Confirmed from Postman **"GET Action options"** live response (200).

## Action options

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/orders/action-options` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.orders.actionOptions` |
| Feature flag | `dashboard` in `VITE_ADMIN_REAL_API_FEATURES` |
| UI | Incident details → Take action modals (dropdown / chip catalogs) |

### Confirmed `data` (live)

| Field | Shape | Incident modal |
| --- | --- | --- |
| `redispatchReasons` | `string[]` | Redispatch → Reason for remake |
| `refundReasons` | `string[]` | Refund → Reason |
| `refundDestinations` | `{ id, label }[]` | Refund → Refund to |
| `reassignReasons` | `string[]` | Reassign champ → Reason |
| `flagMetrics` | `{ id, label }[]` | Flag vendor → VPI metric |
| `flagSeverities` | `string[]` (`MINOR` / `MAJOR` / `CRITICAL`) | Flag vendor → Severity |
| `flagActions` | `{ id, label }[]` | Flag vendor → Action |
| `flagReasons` | `string[]` | Flag vendor → Reason |
| `cancelCauses` | `string[]` | Cancel → Cause chips |
| `cancelReasonsByCause` | `{ [cause]: string[] }` | Cancel → Reason (by cause) |
| `suspendTypes` | `{ id, label }[]` | Suspend champ → Suspension type |
| `suspendDurations` | `{ hours, label }[]` | Suspend champ → Duration (`TEMPORARY` only) |
| `suspendReasons` | `string[]` | Suspend champ → Reason |

**Not in this response:** cancel `itemDisposition` / cancel `refund` catalogs — UI uses confirmed Postman defaults (`CHAMP_KEEPS`, `FULL`) plus design radios (`RETURN_TO_VENDOR`, `PARTIAL`, `NONE`).

### Sample `data`

```json
{
  "redispatchReasons": ["Damaged in transit", "Wrong / missing items", "…"],
  "refundReasons": ["Late delivery — SLA breach", "…"],
  "refundDestinations": [
    { "id": "WALLET", "label": "Yjeek Wallet — instant" },
    { "id": "ORIGINAL_PAYMENT", "label": "Original payment (card) — 3–5 working days (queued until gateway confirms)" }
  ],
  "reassignReasons": ["Champ unresponsive", "…"],
  "flagMetrics": [{ "id": "RELIABILITY", "label": "Reliability" }, { "id": "PREP_TIME", "label": "Prep time (25%)" }],
  "flagSeverities": ["MINOR", "MAJOR", "CRITICAL"],
  "flagActions": [{ "id": "LOG_FLAG", "label": "Log flag + update VPI" }],
  "flagReasons": ["Acceptance SLA breach — slow to accept", "…"],
  "cancelCauses": ["VENDOR", "CHAMP", "CUSTOMER", "PLATFORM"],
  "cancelReasonsByCause": {
    "VENDOR": ["Vendor cannot fulfill", "Stock out", "Store closed", "Other"],
    "CHAMP": ["Champ could not complete delivery", "…"]
  },
  "suspendTypes": [
    { "id": "TEMPORARY", "label": "Temporary suspension" },
    { "id": "PENDING_REVIEW", "label": "Pending review (account locked)" },
    { "id": "TERMINATE", "label": "Terminate — DSA clause" }
  ],
  "suspendDurations": [
    { "hours": 24, "label": "24 hours" },
    { "hours": 48, "label": "48 hours" },
    { "hours": 168, "label": "7 days" }
  ],
  "suspendReasons": ["Conduct breach — 3rd offense", "…"]
}
```

## Take-action POSTs

| Action code | Method | Path | Body keys |
| --- | --- | --- | --- |
| `REDISPATCH` | POST | `/admin/orders/:orderId/redispatch` | `scope`, `itemIds`, `reason`, `notifyCustomer` |
| `REFUND` | POST | `/admin/orders/:orderId/refund` | `type`, `amount?`, `destination`, `reason`, `idempotencyKey` |
| `REASSIGN_CHAMP` | POST | `/admin/orders/:orderId/reassign-champ` | `driverId`, `reason`, `notifyCustomer` |
| `FLAG_VENDOR` | POST | `/admin/orders/:orderId/flag-vendor` | `metric`, `severity`, `action`, `reason`, `notifyVendor` |
| `CANCEL` | POST | `/admin/orders/:orderId/cancel` | `itemDisposition`, `refund`, `cause`, `reason` |
| `SUSPEND_CHAMP` | POST | `/admin/orders/:orderId/suspend-champ` | `type`, `durationHours?`, `reason`, `driverId` |
| `MARK_RESOLVED` | POST | `/admin/incidents/:incidentId/resolve` | `outcome` |

## App wiring

```
IncidentOrderModal
  → useAdminOrderActionOptions → GET /admin/orders/action-options
  → mapAdminOrderActionOptionsResponse
  → Take action menu → modal:
       REASSIGN_CHAMP  → AdminReassignChampModal
       REDISPATCH      → AdminRedispatchOrderModal
       REFUND          → AdminRefundModal
       CANCEL          → AdminCancelOrderModal
       SUSPEND_CHAMP   → AdminOrderSuspendChampModal
       FLAG_VENDOR     → AdminFlagVendorModal
       MARK_RESOLVED   → AdminOrderTakeActionPanel (outcome form)
```
