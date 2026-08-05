# Vendor Dashboard API contract

Confirmed from Postman samples. Real IDs are redacted.

## Endpoint

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/dashboard` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.dashboard` |

### Query params

| Param | Notes |
| --- | --- |
| `branchId` | Sent when resolved from session / primary branch |

## Success (HTTP 200)

Includes `kpis`, `recentOrders`, `revenueChart`, `topSellers`, `period`, `previousPeriod`.

### Confirmed `recentOrders[]` item fields

```json
{
  "id": "<redacted>",
  "orderNumber": "<redacted>",
  "status": "CONFIRMED",
  "orderType": "DELIVERY",
  "totalAmount": 4.4,
  "branch": "Green Kitchen — Manama",
  "customer": "<redacted>",
  "createdAt": "<iso-datetime>"
}
```

### Frontend recent-orders mapping

| UI column | Source |
| --- | --- |
| ORDER # | `orderNumber` (fallback `id`) |
| TYPE | `orderType` → title case (`DELIVERY` → `Delivery`) |
| STATUS | `status` → title case (`PENDING_VENDOR_ACCEPT` → `Pending Vendor Accept`) |
| BRANCH | `branch` (string) |
| TOTAL | `totalAmount` formatted as `N.NNN BHD` |

### Confirmed `topSellers[]` item fields

```json
{
  "rank": 1,
  "productId": "<redacted>",
  "name": "Classic Burger",
  "quantitySold": 8,
  "revenue": 28,
  "imageUrl": null
}
```

| UI | Source |
| --- | --- |
| Rank badge | `rank` |
| Name | `name` |
| Sold | `quantitySold` → `sold` |

### Still sparse / empty in samples

- `revenueChart.points[]` item shape (empty → empty chart)

## Modes

| Flag | Behavior |
| --- | --- |
| `VITE_VENDOR_USE_MOCK_API=false` | Real dashboard API |
| Admin | Untouched |
