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

### Confirmed response

`data` contains:

- `tab: "delivery_pickup"`
- `columns.new`, `columns.accepted`, `columns.preparing`, `columns.ready`
- `activeCount`

Each order may contain:

`id`, `orderNumber`, `orderType`, `fulfillmentType`, `deliverySpeed`, `status`,
`paymentStatus`, `paymentMethod`, `branch`, `customer`, `itemCount`,
`itemsPreview`, `subtotal`, `deliveryFee`, `serviceFee`, `vatAmount`,
`totalAmount`, `kitchenNote`, `estimatedReadyMin`, `vendorAcceptDeadline`,
`paymentDeadline`, `windowStartAt`, `windowEndAt`, `arriveByAt`, `scheduledAt`,
`prepStartedAt`, `readyAt`, `handedOverAt`, `driver`, `createdAt`,
`confirmedAt`, and `primaryAction`.

`primaryAction`, when present:

```json
{
  "key": "HANDOVER_TO_CUSTOMER",
  "label": "Handover to customer",
  "method": "POST",
  "path": "/vendor-panel/orders/:orderId/complete"
}
```

### Frontend mapping (delivery / pickup)

| UI field | Source |
| --- | --- |
| Order number | `orderNumber` |
| Pickup badge | `orderType === "PICKUP"` |
| Items / total | `itemsPreview` / `totalAmount` |
| Customer | `customer.name` |
| Accept countdown | derived from `vendorAcceptDeadline` |
| Preparation elapsed time | derived from `prepStartedAt` |
| Ready status | `status`, `orderType`, and `driver.name` |
| Action label | `primaryAction.label` |
| Header active count | `activeCount` |

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

Only valid from **New** (pending acceptance). Calling accept on `PREPARING` (or later) returns `400` (`Order cannot transition from PREPARING`).

## Reject order

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/vendor-panel/orders/:orderId/reject` |
| Body | `{ "reason": string, "note"?: string }` |
| Registry | `endpoints.vendor.orders.reject(orderId)` |
| Service | `orderService.rejectOrder(orderId, { reason, note })` |

Uses backend cuid `order.id` (`backendId` on UI cards), not display `orderNumber`.

`reason` is required (UI reason list). Optional `note` is sent only when non-empty.

Success removes the order from the New column and refetches the live board.

Only valid from **New**. Calling reject on `PREPARING` (or later) returns `400` (`Order cannot transition from PREPARING`).

## Start preparing

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/vendor-panel/orders/:orderId/start-preparing` |
| Body | Empty `{}` |
| Registry | `endpoints.vendor.orders.startPreparing(orderId)` |
| Service | `orderService.startPreparing(orderId)` |

Uses backend cuid `order.id` (`backendId` on UI cards), not display `orderNumber`.

Valid from **Accepted** (delivery/pickup) or **Confirmed** (dine-in). Calling it when the order is already `PREPARING` returns `400` (`Order cannot transition from PREPARING`).

UI: Accepted-column **Start preparing** (delivery/pickup) and Confirmed-column **Start preparing** (dine-in) use `primaryAction` when present; otherwise fall back to this endpoint, then move the card to Preparing and refetch.

## Mark ready

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/vendor-panel/orders/:orderId/mark-ready` |
| Body | Empty `{}` |
| Registry | `endpoints.vendor.orders.markReady(orderId)` |
| Service | `orderService.markReady(orderId)` |

Uses backend cuid `order.id` (`backendId` on UI cards), not display `orderNumber`.

Valid from **Preparing**. Success returns the order with `status: "READY_FOR_PICKUP"`.

UI: Preparing-column **Mark ready** (delivery/pickup and dine-in) uses `primaryAction` when present; otherwise falls back to this endpoint, then moves the card to Ready and refetches.

## Complete order

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/vendor-panel/orders/:orderId/complete` |
| Body | Empty `{}` |
| Registry | `endpoints.vendor.orders.complete(orderId)` |
| Service | `orderService.completeOrder(orderId)` |

Uses backend cuid `order.id` (`backendId` on UI cards), not display `orderNumber`.

UI: Dine-in Ready-column **Verify & complete** calls this endpoint, removes the card from Ready, and refetches. Delivery/pickup uses the same path when `primaryAction` advertises `/complete` (e.g. handover to customer).

## Unconfirmed

- Check-in / No-show POSTs

When `primaryAction` is present, the frontend executes its confirmed `method`
and relative `path` after validating that it is a Vendor order POST/PATCH path.

## Modes

| Flag | Behavior |
| --- | --- |
| `VITE_VENDOR_USE_MOCK_API=false` | Real delivery_pickup + dine_in + accept + reject + start-preparing + mark-ready + complete |
| Admin | Untouched |
