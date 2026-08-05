# Admin Customers — Summary, List, Get, Wallet, Support

Confirmed from Postman **08. Customers**.

## Summary

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/customers/summary` |
| Feature | `customers` (or `VITE_ADMIN_USE_MOCK_API=false`) |

| UI KPI | Source |
| --- | --- |
| Total customers | `totalCustomers` |
| Active (30d) | `activeLast30d` |
| New (30d) | `newLast30d` |
| Refunded amount | `refundedAmount` → `BHD …` |
| Wallet balance | `walletBalance` → `BHD …` |
| Suspended | `suspendedCount` |

## List customers

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/customers` |
| Query | `search`, `statusTab` (`all`·`active`·`new`·`suspended`), `limit` |

## Get customer

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/customers/{{customerId}}` |

Maps `profile` + `kpis` + `controls` into Overview.

## Suspend

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/customers/{{customerId}}/suspend` |
| Body | `{ "reason": "Fraud review", "duration": "until_reviewed", "notifyCustomer": true }` |

UI durations map to: `until_reviewed`, `7_days`, `30_days`, `permanent`.  
Wired to **Suspend customer** button + Account active toggle (off). Internal note is UI-only (not in confirmed body).

## Activate

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/customers/{{customerId}}/activate` |
| Body | none |

Wired to **Activate customer** button (when suspended) + Account active toggle (on).

## Wallet ledgers

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/customers/{{customerId}}/wallet` |
| Query | `page`, `limit` |

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalBalance": 0,
      "mainBalance": 0,
      "refundBalance": 0,
      "cashbackBalance": 0,
      "cashbackEarned": 0,
      "cashbackPending": 0,
      "cashbackWithdrawn": 0
    },
    "refund": { "balance": 0, "total": 0, "page": 1, "limit": 20, "transactions": [] },
    "cashback": {
      "balance": 0,
      "earned": 0,
      "pending": 0,
      "withdrawn": 0,
      "total": 0,
      "page": 1,
      "limit": 20,
      "transactions": []
    }
  }
}
```

| UI | Source |
| --- | --- |
| Refund balance | `refund.balance` (fallback `summary.refundBalance`) |
| Cashback balance | `cashback.balance` / `summary.cashbackBalance` |
| Earned (lifetime) | `cashback.earned` / `summary.cashbackEarned` |
| Pending | `cashback.pending` / `summary.cashbackPending` |
| Withdrawn | `cashback.withdrawn` / `summary.cashbackWithdrawn` |
| Refund / cashback tables | `*.transactions[]` (empty OK; item shape unconfirmed) |

## Support tickets

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/customers/{{customerId}}/support` |
| Query | `page`, `limit` |

```json
{
  "success": true,
  "data": { "page": 1, "limit": 20, "total": 0, "tickets": [] }
}
```

Empty `tickets` is confirmed. When items exist, mapper looks for `id`/`ticketNumber`, `subject`, `orderId`, `status`, `createdAt`, `updatedAt`, `remark` (send a sample row to lock field names).

## Not wired yet

- SLA tab (no customer SLA endpoint in this folder)
- Reset password
- Support create / reply / update
- Ticket detail + messages

## Files

- `src/mappers/admin/mapAdminCustomers.js`
- `src/services/admin/customerService.js`
- `AdminCustomersPage.jsx`, `AdminCustomerDetailPage.jsx`
- `AdminCustomerWallet.jsx`, `AdminCustomerSupport.jsx`
