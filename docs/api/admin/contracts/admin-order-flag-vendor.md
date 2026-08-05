# Admin Orders — Flag vendor

Confirmed from Postman **"Flag vendor"** + api-doc.

## Flag vendor

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/orders/:orderId/flag-vendor` |
| Feature | `dashboard` |
| UI | Incident details → Take action → Flag vendor |

### Body (confirmed)

```json
{
  "metric": "PREP_TIME",
  "severity": "MAJOR",
  "action": "LOG_FLAG",
  "reason": "Chronic late prep",
  "notifyVendor": true
}
```

| Field | Source |
| --- | --- |
| `metric` | action-options `flagMetrics` |
| `severity` | action-options `flagSeverities` |
| `action` | action-options `flagActions` |
| `reason` | action-options `flagReasons` |
| `notifyVendor` | toggle |

### UI gaps

- **Evidence / note** — shown in modal, **not** sent (no API field)
- **Current VPI %** — design shows it; not on order detail response (omitted)

## App wiring

```
AdminFlagVendorModal
  → adminOrderService.flagVendor(orderId, body)
```
