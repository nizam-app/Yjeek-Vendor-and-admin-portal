# Admin Orders — Refund

Confirmed from Postman **"POST Refund"** request + success response (order `YJK-LIVE-002`).

## Refund

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/orders/:orderId/refund` |
| Feature | `dashboard` |
| UI | Incident details → Take action → Refund — full/partial |

### Body (confirmed)

```json
{
  "type": "PARTIAL",
  "amount": 1.5,
  "destination": "WALLET",
  "reason": "Missing item",
  "idempotencyKey": "admin-refund-{{orderId}}-001"
}
```

| Field | Notes |
| --- | --- |
| `type` | `FULL` \| `PARTIAL` |
| `amount` | Required when `PARTIAL` |
| `destination` | From action-options `refundDestinations` (`WALLET`, …) |
| `reason` | From action-options `refundReasons` |
| `idempotencyKey` | Unique per submit (`admin-refund-{orderId}-{timestamp}`) |

### Confirmed success `data` (key fields)

```json
{
  "message": "Refund issued to wallet",
  "amount": 1.5,
  "destination": "WALLET",
  "status": "PAID",
  "gatewayRequired": false,
  "refund": {
    "id": "…",
    "orderId": "…",
    "amount": 1.5,
    "destination": "WALLET",
    "status": "COMPLETED",
    "reason": "Missing item",
    "idempotencyKey": "…",
    "requestedByName": "Super Admin",
    "walletTransactionId": "…"
  },
  "remainingRefundable": 9.5,
  "order": { /* full order detail incl. refunds[], incidents[], availableActions[] */ }
}
```

UI uses `remainingRefundable` (or computes from `payment.amount − completed refunds`) to cap partial amounts. On success the modal closes and order detail is refetched.

### UI gaps

- **Note (optional)** — shown in modal, **not** sent (no API field confirmed)

## App wiring

```
AdminRefundModal
  → adminOrderService.refund(orderId, body)
  → refetch order detail
```

## Related take actions (already wired)

| Action | Method | Path |
| --- | --- | --- |
| Redispatch | POST | `/admin/orders/:id/redispatch` |
| Reassign champ | POST | `/admin/orders/:id/reassign-champ` |
| Flag vendor | POST | `/admin/orders/:id/flag-vendor` |
| Cancel | POST | `/admin/orders/:id/cancel` |
| Suspend champ | POST | `/admin/orders/:id/suspend-champ` |
| Mark resolved | POST | `/admin/incidents/:id/resolve` |

**Note:** `SUSPEND_CHAMP` is hidden in the Take-action menu when the order has no assigned champ (`champ: null`). Reassign may still return `409 CONFLICT` — *"Champ is not currently available"*.
