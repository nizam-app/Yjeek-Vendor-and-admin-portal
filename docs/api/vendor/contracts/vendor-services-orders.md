# Vendor Services Board + Calendar API contract

Confirmed from Postman. Real IDs are redacted.

## Services board

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/orders/services` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.orders.services` |
| UI | **Services** → Board view |

### Query params

| Param | Value |
| --- | --- |
| `branchId` | Resolved from `user.vendorLocationId` or primary/first branch |

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "view": "board",
    "columns": {
      "new": [],
      "confirmed": [
        {
          "id": "<redacted>",
          "orderNumber": "<redacted>",
          "orderType": "SERVICE",
          "fulfillmentType": "SCHEDULED",
          "status": "CONFIRMED",
          "paymentStatus": "PAID",
          "paymentMethod": "YJEEK_WALLET",
          "branch": { "name": "<redacted>", "area": "<redacted>" },
          "customer": {}
        }
      ]
    }
  }
}
```

`new: []` with bookings only in `confirmed` is valid.

### UI column mapping

| API key | UI column |
| --- | --- |
| `new` | New |
| `confirmed` (or `upcoming`) | Upcoming |
| `inProgress` / `preparing` | In progress |

## Services calendar

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/orders/services/calendar` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.orders.servicesCalendar` |
| UI | **Services** → Calendar view |
| Hook | `useVendorServiceCalendar` → `orderService.getServiceCalendar` |

### Query params

| Param | Value |
| --- | --- |
| `month` | `YYYY-MM` (e.g. `2026-07`) |
| `branchId` | Resolved from `user.vendorLocationId` or primary/first branch |

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "month": "2026-07",
    "totalBookings": 1,
    "days": [
      {
        "date": "2026-07-10",
        "count": 1,
        "statuses": {
          "confirmed": 1
        }
      }
    ]
  }
}
```

### UI mapping

| API field | UI |
| --- | --- |
| `days[].count` | Green badge on calendar cell (`N booking(s)`) |
| `days[].statuses` | Day drill-down status tallies |
| `totalBookings` | Month header total |

## Unconfirmed

- Calendar day booking list (individual booking rows)
- Full service-item field list beyond board/detail sample

## Mutations (wired)

| Action | Method / path |
| --- | --- |
| Accept | `POST /vendor-panel/orders/:id/accept` |
| Reject | `POST /vendor-panel/orders/:id/reject` |
| Check-in | `POST /vendor-panel/orders/:id/check-in` |
| No-show | `POST /vendor-panel/orders/:id/no-show` |
| Mark complete | `POST /vendor-panel/orders/:id/complete` |

## Modes

| Flag | Behavior |
| --- | --- |
| `VITE_VENDOR_USE_MOCK_API=false` | Real services board + calendar |
| Admin | Untouched |
