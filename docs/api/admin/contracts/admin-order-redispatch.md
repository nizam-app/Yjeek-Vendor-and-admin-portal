# Admin Orders — Redispatch order

Confirmed from Postman **"Redispatch"** + api-doc.

## Redispatch

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/orders/:orderId/redispatch` |
| Feature | `dashboard` |
| UI | Incident details → Take action → Redispatch order |

### Body (confirmed)

```json
{
  "scope": "FULL",
  "itemIds": [],
  "reason": "Missing item remake",
  "notifyCustomer": true
}
```

| Field | Notes |
| --- | --- |
| `scope` | `FULL` \| `PARTIAL` |
| `itemIds` | Required when `PARTIAL`; empty array for `FULL` |
| `reason` | From action-options `redispatchReasons` |
| `notifyCustomer` | boolean |

### UI gaps

- **Note (optional)** — shown in modal, **not** sent (no API field)

## App wiring

```
AdminRedispatchOrderModal
  → adminOrderService.redispatch(orderId, body)
```
