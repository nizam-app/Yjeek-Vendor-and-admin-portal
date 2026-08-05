# Admin Fleet — Champ earnings

Confirmed from Postman **"GET Earnings breakdown"** + response sample.

## Earnings

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/fleet/champs/:champId/earnings` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.fleet.champEarnings` |
| Feature flag | `fleet` |
| UI | `/admin/fleet/:champId` → **Earnings** tab |

### Confirmed query

| Param | Example | Notes |
| --- | --- | --- |
| `from` | `2024-06-01T00:00:00.000Z` | UI defaults to ~last 30 days when omitted |
| `to` | `2024-06-30T23:59:59.000Z` | |
| `limit` | `30` | Breakdown row limit |

### Confirmed success `data`

```json
{
  "summary": {
    "today": { "deliveries": 14, "earnings": 19.6, "tips": 2, "incentive": 3 },
    "week": { "deliveries": 50, "earnings": 70, "tips": 7.5, "incentive": 8 },
    "lifetime": { "deliveries": 50, "earnings": 85.5, "tips": 7.5, "incentive": 8 }
  },
  "breakdown": []
}
```

Empty `breakdown: []` is valid → table shows **No earnings in this period.**

### UI mapping

| UI | API |
| --- | --- |
| Today card | `summary.today.earnings` → `BHD x.xxx` |
| This week card | `summary.week.earnings` |
| Lifetime card | `summary.lifetime.earnings` |
| Breakdown table | `breakdown[]` |

**Gap:** UI cards only show earnings totals (not deliveries/tips/incentive from summary buckets). Those fields are kept on the mapper as `buckets` for later.

**Gap:** No sample breakdown row — row fields inferred as `date`, `deliveries`, `earnings`, `tips`, `incentive`.

## App wiring

```
AdminChampDetailPage (Earnings tab)
  → adminService.getAdminFleetChampEarnings(champId, { limit: 30 })
  → GET /admin/fleet/champs/:id/earnings?from&to&limit
  → mapAdminChampEarningsResponse
  → AdminChampEarnings
```
