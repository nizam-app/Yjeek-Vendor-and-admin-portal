# Admin Orders — Cancel order

Confirmed from Postman **"Cancel order"** + api-doc.

## Cancel

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/orders/:orderId/cancel` |
| Feature | `dashboard` |
| UI | Incident details → Take action → Cancel order |

### Body (confirmed)

```json
{
  "itemDisposition": "CHAMP_KEEPS",
  "refund": "FULL",
  "cause": "VENDOR",
  "reason": "Vendor cannot fulfil"
}
```

| Field | Source |
| --- | --- |
| `itemDisposition` | UI radios — sample `CHAMP_KEEPS`; design also has return-to-vendor (`RETURN_TO_VENDOR`) — not in action-options catalog |
| `refund` | UI radios — `FULL` / `PARTIAL` / `NONE` (sample `FULL`) |
| `cause` | action-options `cancelCauses` |
| `reason` | action-options `cancelReasonsByCause[cause]` |

### UI gaps

- **Note (optional)** — shown in modal, **not** sent (no API field)
- **itemDisposition / refund catalogs** — not in action-options; UI uses confirmed sample + design options

## App wiring

```
AdminCancelOrderModal
  → adminOrderService.cancel(orderId, body)
```
