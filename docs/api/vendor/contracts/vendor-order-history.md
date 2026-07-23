# Vendor Orders History API contract

Confirmed from Postman. Real IDs are redacted.

## History list

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/orders/history` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.orders.history` |
| UI | **Orders history** |
| Hook | `useVendorOrderHistory` → `orderService.getOrderHistory` |

### Query params

| Param | Value |
| --- | --- |
| `limit` | Confirmed sample uses `20` |

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "<redacted>",
        "orderNumber": "<redacted>",
        "orderType": "DELIVERY",
        "fulfillmentType": "ON_DEMAND",
        "deliverySpeed": null,
        "status": "CANCELLED",
        "paymentStatus": "PENDING",
        "paymentMethod": "CASH",
        "branch": {
          "id": "<redacted>",
          "name": "<redacted>",
          "area": "<redacted>"
        },
        "customer": {
          "id": "<redacted>",
          "name": "<redacted>",
          "phone": "<redacted>"
        }
      }
    ]
  }
}
```

### UI mapping

| UI column | Source |
| --- | --- |
| Order # | `orderNumber` |
| Type | `orderType` → Delivery / Pickup / Dine-in / Services |
| Status | `status` (title-cased for pills) |
| Branch | `branch.name` |
| Customer | `customer.name` |
| When | optional timestamp fields when present, else `—` |
| Total | `totalAmount` / `total` when present, else `—` |

List rows keep `backendId` (`id`) for detail / receipt navigation.

## Order detail

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/orders/:orderId` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.orders.detail(orderId)` |
| UI | **Orders history** → Order details |
| Hook | `useVendorOrderDetail` → `orderService.getOrderDetail` |

Path `orderId` is the backend cuid (`data.id`), not `orderNumber`.

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "id": "<redacted>",
    "orderNumber": "<redacted>",
    "orderType": "DELIVERY",
    "fulfillmentType": "ON_DEMAND",
    "deliverySpeed": null,
    "status": "CONFIRMED",
    "paymentStatus": "PENDING",
    "paymentMethod": "CASH",
    "branch": {
      "id": "<redacted>",
      "name": "<redacted>",
      "area": "<redacted>"
    },
    "customer": {
      "id": "<redacted>",
      "name": "<redacted>",
      "phone": "<redacted>"
    },
    "partySize": null
  }
}
```

## Order receipt

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/orders/:orderId/receipt` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.orders.receipt(orderId)` |
| UI | **Orders history** → Receipt modal |
| Service | `orderService.getOrderReceipt` |

Path `orderId` is the backend cuid.

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "orderNumber": "<redacted>",
    "status": "PENDING",
    "vendorName": "<redacted>",
    "branchName": "<redacted>",
    "orderType": "DELIVERY",
    "fulfillmentType": "ON_DEMAND",
    "deliverySpeed": null,
    "customerName": "<redacted>",
    "items": [
      {
        "name": "Classic Burger",
        "quantity": 1,
        "unitPrice": 3.5,
        "lineTotal": 3.5
      }
    ],
    "subtotal": 3.5,
    "deliveryFee": 0.45,
    "serviceFee": 0.1,
    "discountAmount": 0
  }
}
```

Optional when present: `vatAmount`, `grandTotal`, `paymentMethod`, `paymentStatus`.

### UI mapping

| UI | Source |
| --- | --- |
| Badge | `paymentStatus` or `status` |
| Title | `branchName` |
| Subline | `orderNumber` · customer |
| Line items | `items[]` → qty × name / `lineTotal` |
| Subtotal / Delivery / Service / Discount | matching money fields |
| Total | `grandTotal` / `totalAmount` / `subtotal` |
| Paid | `paymentMethod` when present |

## Unconfirmed

- History filters (`status`, `type`, `branchId`, date range) beyond `limit`
- Pagination cursors / `meta` page info

## Modes

| Flag | Behavior |
| --- | --- |
| `VITE_VENDOR_USE_MOCK_API=false` | Real history list + order detail + receipt |
| Admin | Untouched |
