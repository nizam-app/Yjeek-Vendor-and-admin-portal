# Admin Fleet — Suspend / Unsuspend champ

Confirmed from Postman **"Suspend champ"** + **"Unsuspend champ"**.

## Suspend champ

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/fleet/champs/:champId/suspend` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.fleet.champSuspend` |
| Feature flag | `fleet` |
| UI | Champ detail → **Suspend** / **Suspend champ** |

### Confirmed body

```json
{
  "reason": "Document expired",
  "duration": "until_reviewed",
  "note": "Insurance renewal required before reactivation.",
  "notifyChamp": true
}
```

UI duration mapping:
- Until reviewed → `until_reviewed`
- 7 days → `7_days`
- 30 days → `30_days`
- Permanent → `permanent`

### Known errors

| Status | Example |
| --- | --- |
| `409` | Champ has an active delivery — reassign/complete first |

## Unsuspend champ

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/fleet/champs/:champId/unsuspend` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.fleet.champUnsuspend` |
| Body | none |
| UI | Champ detail → **Unsuspend** when `isSuspended` |

### Known errors

| Status | Example |
| --- | --- |
| `400` | Champ is not suspended |

## App wiring

```
AdminChampDetailPage
  Suspend → AdminSuspendChampModal
    → adminService.suspendAdminFleetChamp(id, form)
    → POST …/suspend
  Unsuspend → adminService.unsuspendAdminFleetChamp(id)
    → POST …/unsuspend
  → refetch overview
```
