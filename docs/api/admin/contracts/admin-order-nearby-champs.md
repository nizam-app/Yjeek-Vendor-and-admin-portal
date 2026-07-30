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
| UI | Incident details → Take action → Reassign champ; Scheduled pipeline → Reassign champ |

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

When items exist, mapper reads id from `id` | `driverId` | `champId` and optional `name` / `displayName` / `fullName` / `status` / `rating` / `distanceKm` / `vehicle` / `activeCount` if present.

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

Shown in the modal error area via `ApiError.message`.

### UX rules

- `driverId` is the **new** champ — do not prefill the currently assigned champ as the only option; first nearby champ may be pre-selected when list is non-empty.
- Reasons come from action-options `reassignReasons`.
- Nearby list populates radio cards; empty list allows manual driver id entry.

## App wiring (admin)

| Surface | Entry | Nearby API |
| --- | --- | --- |
| Live / incident details | Take action → Reassign champ | `AdminReassignChampModal` → `getNearbyChamps` |
| Scheduled column | Declined / No response → **Reassign champ** | same modal |

```
AdminReassignChampModal
  → GET /admin/orders/:orderId/nearby-champs
  → mapAdminNearbyChampsResponse
  → POST /admin/orders/:orderId/reassign-champ
```

**Not wired yet:** Scheduled **Assign champ** page (`AdminAssignChamp.jsx`) still uses mock champ profiles — different assign flow (date/window). Use nearby-champs there only when that screen is converted to real assign/reassign.
