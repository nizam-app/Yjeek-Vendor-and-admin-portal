# Admin Marketing — Notifications list & detail

Confirmed from Postman **12. Marketing** (List notifications, Get notification detail).

## List notifications

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/marketing/notifications` |
| Query | `target=all`, `status=all`, `limit=20` |
| Feature | `marketing` |

| UI column | Source |
| --- | --- |
| Target | `target` |
| Title | `title` |
| Channel | `channelLabel` |
| Date / time | `date` (fallback `sentAt` / `scheduledAt`) |
| Status | `statusKey=delivered` → **Sent** (UI); else `status` |
| Row → detail | `id` |

## Get notification detail

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/marketing/notifications/{{notificationId}}` |

| UI | Source |
| --- | --- |
| KPI cards | `kpis` (recipients / delivered+pct / opened+pct / failed) |
| Message | `message.type`, `message.title`, `message.body`, `message.sender` |
| Audience & delivery | `audienceLabel`, recipients from kpis, `channelLabel`, `sentAt`/`scheduledAt`, status, `createdByName` |
| Delivery by channel | `deliveryByChannel[]` |

## Send customer notification

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/marketing/notifications` |
| Feature | `marketing` |

### Confirmed body

```json
{
  "target": "customer",
  "audience": "by_segment",
  "segmentIds": ["…"],
  "type": "Promo",
  "title": "…",
  "body": "…",
  "push": true,
  "email": true,
  "sms": false,
  "schedule": "now"
}
```

| UI | API |
| --- | --- |
| All customers / By segment / By city / Selected | `audience`: `all` · `by_segment` · `by_city` · `selected` |
| Segment / customer id chips | `segmentIds` (required for `by_segment` / `selected`) |
| Type / Title / Body | `type`, `title`, `body` |
| Push / Email / SMS | `push`, `email`, `sms` |
| Send now | `schedule: "now"` |
| Schedule later | `schedule` = ISO datetime from date+time (format not fully confirmed) |

History table uses `GET /admin/marketing/notifications?target=customer`.

## Not wired yet

- Resend / Delete
- Notifications meta / Estimate audience
- City filters for `by_city`
- Vendor category/status filters for `by_category` / `by_status`

## Files

- `src/mappers/admin/mapAdminMarketingNotifications.js`
- `src/services/admin/marketingService.js`
- `AdminMarketingPage.jsx`, `AdminNotificationDetailPage.jsx`
