# Admin Dashboard — Open chats

Confirmed from Postman screenshots. Real credentials, tokens, and record IDs are redacted.

## Open chats

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/dashboard/chats` |
| Full URL | `{VITE_API_BASE_URL}/admin/dashboard/chats` |
| Auth | Bearer Admin access token via shared `apiClient` |
| Registry | `endpoints.admin.dashboard.chats` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `dashboard` |
| UI | Bottom chats strip on Live Orders, Pickup, Dine-in, Services, Scheduled |

### Success (HTTP 200) — confirmed

```json
{
  "success": true,
  "data": {
    "active": 1,
    "items": [
      {
        "conversationId": "<redacted>",
        "orderId": "<redacted>",
        "orderNumber": "YJK-…",
        "peerRole": "CUSTOMER",
        "peerName": "Sara AlMannai",
        "lastMessage": "Please leave at the door if no answer. Thank you!",
        "lastMessageAt": "2026-07-15T22:59:10.965Z",
        "unread": 2
      }
    ]
  }
}
```

Confirmed `peerRole` sample: `CUSTOMER` (also map `CHAMP` / `VENDOR` when present).

### UI mapping

| UI | Source |
| --- | --- |
| Active count | `data.active` |
| Name | `peerName` |
| Role tag | `peerRole` → Customer / Champ / Vendor |
| Initials | derived from `peerName` |
| Message snippet | `lastMessage` |
| Unread badge | `unread` (hidden when 0) |
| Chat panel order label | `orderNumber` |

### App wiring

```
useAdminChats
  → adminDashboardService.getChats
  → mapAdminChatsResponse
  → apiClient (scope: admin, feature: dashboard)
```

Used by: `AdminLiveOrdersPage`, `AdminIncidentBoard`, `AdminScheduledOrdersPage` (`ChatStrip` / `AdminOpenChats`).
