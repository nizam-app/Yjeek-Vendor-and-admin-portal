# Admin Orders — Get order detail

Confirmed from Postman screenshots. Real credentials, tokens, and record IDs are redacted.

## Get order

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/orders/:orderId` |
| Full URL | `{VITE_API_BASE_URL}/admin/orders/{orderId}` |
| Auth | Bearer Admin access token via shared `apiClient` |
| Registry | `endpoints.admin.orders.detail(orderId)` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `dashboard` |
| UI | Live Orders order-detail modal + incident order modal |

### Success (HTTP 200) — confirmed fields used in UI

| UI | Source |
| --- | --- |
| Order # | `orderNumber` |
| Status / Stage badges | `status`, `stageLabel` |
| Category chip | `category` |
| Subtitle | `vendor.name`, `fulfillmentType`, `placedAt` |
| Items / value / payment / distance | `summary`, `payment`, `distanceKm` |
| Pickup / Drop-off | `locations.pickup`, `locations.dropoff` |
| Line items | `items[]` (`name`, `quantity`, `lineTotal`) |
| Totals | `totals.subtotal`, `deliveryFee`, `discountAmount`, `totalAmount` |
| Timeline | `timeline[]` only (no invented pending stages) |
| Customer / Vendor / Champ | nested objects; `champ` may be `null` → Unassigned |
| Incidents (incident modal) | `incidents[]` |
| Take action menu | `availableActions[]` (confirmed codes only) |

### Confirmed `availableActions` codes

`REASSIGN_CHAMP`, `REDISPATCH`, `REFUND`, `CANCEL`, `SUSPEND_CHAMP`, `FLAG_VENDOR`, `MARK_RESOLVED`

Action POST endpoints use Postman-confirmed bodies; form dropdowns come from `GET /admin/orders/action-options` (see `admin-order-action-options.md`).

### App wiring

```
AdminOrderDetailModal / IncidentOrderModal
  → useAdminOrderDetail(order.orderId)
  → adminOrderService.getOrder
  → mapAdminOrderDetailResponse
  → apiClient (scope: admin, feature: dashboard)
```

Uses the board card’s `orderId` (API id), not the display `orderNumber`.
