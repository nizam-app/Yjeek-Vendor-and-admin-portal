# Admin Orders — Action options + take action

Confirmed from Postman response screenshot + Postman request bodies.

## Action options

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/orders/action-options` |
| Full URL | `{VITE_API_BASE_URL}/admin/orders/action-options` |
| Auth | Bearer Admin access token via shared `apiClient` |
| Registry | `endpoints.admin.orders.actionOptions` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `dashboard` |
| UI | Incident modal Take-action forms (dropdown values) |

### Confirmed `data` fields

| Field | Shape | Used for |
| --- | --- | --- |
| `redispatchReasons` | `string[]` | Redispatch reason select |
| `refundReasons` | `string[]` | Refund reason select |
| `refundDestinations` | `{ id, label }[]` | Refund destination select |
| `reassignReasons` | `string[]` | Reassign champ reason |
| `flagMetrics` | `{ id, label }[]` | Flag vendor metric |
| `flagSeverities` | `string[]` (`MINOR` / `MAJOR` / `CRITICAL`) | Flag severity |
| `flagActions` | `{ id, label }[]` | Flag action |
| `flagReasons` | `string[]` | Flag reason |
| `cancelCauses` | `string[]` | Cancel cause |
| `cancelReasonsByCause` | `{ [cause]: string[] }` | Cancel reason (depends on cause) |
| `suspendTypes` | `{ id, label }[]` | Suspend type |
| `suspendDurations` | `{ hours, label }[]` | Temporary suspend duration |
| `suspendReasons` | `string[]` | Suspend reason |

Do not invent missing catalogs. Cancel `itemDisposition` / `refund` are **not** in this response — Postman sample defaults (`CHAMP_KEEPS`, `FULL`) are prefilled as free text.

## Take-action POSTs (confirmed paths + Postman bodies)

| Action code | Method | Path | Body (confirmed keys) |
| --- | --- | --- | --- |
| `REDISPATCH` | POST | `/admin/orders/:orderId/redispatch` | `scope`, `itemIds`, `reason`, `notifyCustomer` |
| `REFUND` | POST | `/admin/orders/:orderId/refund` | `type`, `amount?`, `destination`, `reason`, `idempotencyKey` |
| `REASSIGN_CHAMP` | POST | `/admin/orders/:orderId/reassign-champ` | `driverId`, `reason`, `notifyCustomer` |
| `FLAG_VENDOR` | POST | `/admin/orders/:orderId/flag-vendor` | `metric`, `severity`, `action`, `reason`, `notifyVendor` |
| `CANCEL` | POST | `/admin/orders/:orderId/cancel` | `itemDisposition`, `refund`, `cause`, `reason` |
| `SUSPEND_CHAMP` | POST | `/admin/orders/:orderId/suspend-champ` | `type`, `durationHours?`, `reason`, `driverId` |
| `MARK_RESOLVED` | POST | `/admin/incidents/:incidentId/resolve` | `outcome` |

`REASSIGN_CHAMP` needs a **new** `driverId` (not the current champ). Nearby list from `GET /admin/orders/:orderId/nearby-champs`; empty list shows manual entry. See `admin-order-nearby-champs.md`.

`SUSPEND_CHAMP` prefills current `champ.id` when present.

## App wiring

```
IncidentOrderModal Take action
  → useAdminOrderActionOptions → adminOrderService.getActionOptions
  → mapAdminOrderActionOptionsResponse
  → AdminOrderTakeActionPanel → adminOrderService.<action>
```
