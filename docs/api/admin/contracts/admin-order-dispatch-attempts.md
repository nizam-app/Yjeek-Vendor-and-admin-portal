# Admin Orders — List dispatch attempts

Confirmed from Postman: `GET /admin/orders/:orderId/dispatch-attempts` returns `200` with an empty `data` array for the tested order.

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/orders/:orderId/dispatch-attempts` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.orders.dispatchAttempts(orderId)` |
| Feature flag | `dashboard` |
| UI | Order detail modal + Incident order modal → **Dispatch attempts** |

## Confirmed success envelope

```json
{
  "success": true,
  "data": []
}
```

`data: []` is valid. Do not invent attempt rows.

Postman description: immutable offer attempts with `scoreBreakdown` for this order. Non-empty item shape is not screenshot-confirmed; the mapper only surfaces known keys when present (`id` / `attemptId`, champ/driver name & id, `status` / `outcome`, `score`, `scoreBreakdown`, `offeredAt` / `createdAt`).

## App wiring

```
AdminOrderDetailModal / IncidentOrderModal
  → useAdminDispatchAttempts
  → adminOrderService.listDispatchAttempts
  → mapAdminDispatchAttemptsResponse
  → AdminOrderDispatchAttempts
```

Empty list shows **No dispatch attempts**.

**Not this API:** Scheduled board `dispatchRows` mock is a pipeline table of orders, not per-order attempt history.
