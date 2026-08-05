# Vendor Scheduled Orders API contract

Confirmed from Postman. Real IDs are redacted.

## Scheduled board

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/orders/scheduled` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.orders.scheduled` |
| UI | **Scheduled** |

### Query params

| Param | Value |
| --- | --- |
| `branchId` | Resolved from `user.vendorLocationId` or primary/first branch |
| `date` | `today` (default in UI) |

Optional (echoed in `filters`, not fully wired in UI yet): `window`, `sort`, `search`.

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "columns": {
      "new": [],
      "confirmed": [],
      "preparing": [],
      "readyForPickup": []
    },
    "count": 0,
    "filters": {
      "date": "today",
      "window": "all",
      "sort": "window",
      "search": ""
    }
  }
}
```

Empty arrays are valid — UI shows “No orders” per column.

### Column mapping

| API key | UI column |
| --- | --- |
| `new` | New |
| `confirmed` | Confirmed |
| `preparing` | Preparing |
| `readyForPickup` | Ready for pickup |

Order item fields reuse the same board-card shape as live orders when present (`orderNumber`, `customer`, `itemsPreview`, window timestamps, etc.).

## Unconfirmed

- Confirm / Decline / Start preparing / Mark ready / Handover POSTs
- Date picker values other than `today`
- Window / sort controls as API query params

## Modes

| Flag | Behavior |
| --- | --- |
| `VITE_VENDOR_USE_MOCK_API=true` | Mock scheduled columns |
| `VITE_VENDOR_USE_MOCK_API=false` | Real scheduled board |
| Admin | Untouched |
