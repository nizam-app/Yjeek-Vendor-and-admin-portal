# Admin Orders — Nearby champs + Reassign / Assign champ

Confirmed from Postman response screenshots.

## Nearby champs

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/orders/:orderId/nearby-champs` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.orders.nearbyChamps(orderId)` |
| Feature flag | `dashboard` |
| UI | Incident details → Take action → Reassign champ; Scheduled pipeline → Reassign champ; Scheduled **Assign champ** page |

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

When items exist, mapper reads id from `id` | `driverId` | `champId` and optional `name` / `displayName` / `fullName` / `status` / `rating` / `distanceKm` / `vehicle` / `activeCount` / `capacity` / location-tier fields if present.

## Reassign / Assign champ

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/admin/orders/:orderId/reassign-champ` |
| Body | `{ "driverId", "reason", "notifyCustomer" }` |

Used for both **reassign** (modal) and first **assign** from Scheduled Assign champ page (no separate assign endpoint in Postman).

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

Shown in the modal / page error area via `ApiError.message`.

### UX rules

- `driverId` is the **new** champ — do not prefill the currently assigned champ as the only option; first nearby champ may be pre-selected when list is non-empty.
- Reasons come from action-options `reassignReasons` when available; Assign page falls back to `"Scheduled assignment"` for first assign.
- Nearby list populates the picker/table; empty list is valid (show empty state).

## App wiring (admin)

| Surface | Entry | Nearby API |
| --- | --- | --- |
| Live / incident details | Take action → Reassign champ | `AdminReassignChampModal` → `getNearbyChamps` |
| Scheduled column | Declined / No response → **Reassign champ** | same modal |
| Scheduled pipeline / New column | **Assign date · time · champ** | `AdminAssignChamp` page |

```
AdminAssignChamp (/admin/scheduled/assign/:orderId)
  → GET /admin/orders/:orderId
  → GET /admin/orders/:orderId/nearby-champs
  → mapAdminNearbyChampsResponse
  → POST /admin/orders/:orderId/reassign-champ
```

### Gaps (do not invent)

- No confirmed API to persist **delivery date / time window** from the Assign page selects — UI keeps local selects; confirm only sends `driverId` + `reason` + `notifyCustomer`.
- No confirmed **jobs-by-date** payload on nearby champs — popover shows `activeCount` when present; otherwise empty.
- Rich table columns (gov/city/block/tier/type/allowed) render only when nearby item includes those keys; otherwise `—`.
