# Vendor Live Orders API contract

Confirmed from Postman / response samples. Real IDs, phones, and names are redacted.

## Live board — Delivery & Pickup

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/orders/live` |
| Query | `tab=delivery_pickup`, optional `branchId` |
| Registry | `endpoints.vendor.orders.live` |

Columns: `new`, `accepted`, `preparing`, `ready`.

## Live board — Dine-in

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/orders/live` |
| Query | `tab=dine_in`, optional `branchId` |
| UI | Live orders → **Dine-in** |

### Confirmed column keys

| API key | UI column |
| --- | --- |
| `new` | New |
| `confirmed` | Confirmed |
| `preparing` | Preparing |
| `readyForGuest` | Ready for guest (`ready` in UI) |

`new: []` with an order only in `confirmed` is valid — that order is past New.

### Confirmed order fields (sample)

`id`, `orderNumber`, `orderType` (`DINE_IN`), `fulfillmentType`, `status`, `paymentStatus`, `paymentMethod`, `branch`, `customer` (`id`/`name`/`phone`), `partySize`, `dineInPrepMode` (`PREPARE_NOW` / `PREPARE_ON_ARRIVAL`), `itemCount`, `itemsPreview`, `subtotal`, `totalAmount`, `scheduledDineInAt`, fees/VAT, timestamps, `activeCount` on `data`.

### Frontend mapping (dine-in)

| UI field | Source |
| --- | --- |
| `id` | `orderNumber` |
| `guest` | `customer.name` |
| `guests` | `partySize` |
| `tag` | `PREPARE_NOW` → Prepare now; `PREPARE_ON_ARRIVAL` → Prepare on arrival |
| `when` | `scheduledDineInAt` (formatted) |
| `arrived` | explicit check-in fields, else `true` when `PREPARE_NOW` |
| `items` / `total` | `itemsPreview` / `totalAmount` |
| Ready column | `columns.readyForGuest` |

## Accept order

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/vendor-panel/orders/:orderId/accept` |
| Body | Empty `{}` |
| Registry | `endpoints.vendor.orders.accept(orderId)` |
| Service | `orderService.acceptOrder(orderId)` |

Uses backend cuid `order.id` (`backendId` on UI cards), not display `orderNumber`.

Success `200` returns the updated order (`status: "CONFIRMED"`, `items[]`, money fields, address, etc.). UI opens the accept receipt modal from that payload, then refetches the live board.

## Unconfirmed

- Reject / Check-in / Start preparing / Mark ready / Handover / No-show POSTs

## Modes

| Flag | Behavior |
| --- | --- |
| `VITE_VENDOR_USE_MOCK_API=false` | Real delivery_pickup + dine_in + accept |
| Admin | Untouched |
