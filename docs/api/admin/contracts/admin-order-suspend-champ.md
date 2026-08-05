# Admin Orders — Suspend champ (from order)

Confirmed from Postman **"Suspend champ (from order)"** + api-doc.

## Suspend champ

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/orders/:orderId/suspend-champ` |
| Feature | `dashboard` |
| UI | Incident details → Take action → Suspend champ |

### Body (confirmed)

```json
{
  "type": "TEMPORARY",
  "durationHours": 24,
  "reason": "Customer complaint",
  "driverId": "{{champId}}"
}
```

| Field | Source |
| --- | --- |
| `type` | action-options `suspendTypes` |
| `durationHours` | action-options `suspendDurations` — only when type is `TEMPORARY` |
| `reason` | action-options `suspendReasons` |
| `driverId` | Current order champ id |

### UI gaps

- **Evidence / note** — shown in modal, **not** sent (no API field)

## App wiring

```
AdminOrderSuspendChampModal
  → adminOrderService.suspendChamp(orderId, body)
```
