# Admin Orders — Nearby champs + Reassign champ

Confirmed from Postman response screenshots.

## Nearby champs

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/orders/:orderId/nearby-champs` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.orders.nearbyChamps(orderId)` |
| Feature flag | `dashboard` |
| UI | Reassign champ Take-action form |

### Confirmed success envelope

```json
{
  "success": true,
  "data": {
    "orderId": "<id>",
    "orderNumber": "<number>",
    "status": "<status>",
    "currentChamp": null,
    "nearby": []
  }
}
```

`nearby: []` and `currentChamp: null` are valid. Do not invent champ rows.

When items exist, mapper reads id from `id` | `driverId` | `champId` and optional `name` / `displayName` / `fullName` / `status` if present. A non-empty item screenshot is still preferred for richer UI.

## Reassign champ

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/admin/orders/:orderId/reassign-champ` |
| Body | `{ "driverId", "reason", "notifyCustomer" }` |

### Confirmed conflict (HTTP 409)

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Champ is not currently available"
  }
}
```

Shown in the Take-action form error area via `ApiError.message`.

### UX rules

- `driverId` is the **new** champ — do not prefill the currently assigned champ.
- Reasons come from action-options `reassignReasons`.
- Nearby list (when non-empty) populates a select; manual id entry remains as fallback.

## App wiring

```
AdminOrderTakeActionPanel (REASSIGN_CHAMP)
  → adminOrderService.getNearbyChamps(orderId)
  → mapAdminNearbyChampsResponse
  → on Confirm: adminOrderService.reassignChamp(orderId, body)
```
