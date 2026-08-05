# Admin Fleet — Champ Overview (detail)

Confirmed from Postman **"Overview"** + create-champ response shape.

## Get champ overview

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/fleet/champs/:champId` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.fleet.champ` |
| Feature flag | `fleet` (also when `VITE_ADMIN_USE_MOCK_API=false`) |
| UI | `/admin/fleet/:champId` Overview tab |

### Confirmed `data` shape (same as create `data.champ`)

```json
{
  "header": { "id": "…", "displayCode": "DRV-54A93D", "name": "Ahmed Ali", "statusLabel": "Offline", "tier": "BRONZE", "supplier": { "id": "…", "name": "RapidGo", "type": "THIRD_PARTY" }, "joinedAt": "…" },
  "kpis": { "lifetimeDeliveries": 0, "acceptanceRate": 0, "avgRating": 0, "onTimeRate": 0, "cancellationCount": 0 },
  "profile": { "firstName": "Ahmed", "lastName": "Ali", "cprNumber": "…", "allowedCategories": [], "dailyCashLimit": 50, "city": "Manama", "zone": "Adliya", "vehicle": { "type": "BIKE", "…" } },
  "controls": { "online": false, "zone": "Adliya", "codAmount": 0 },
  "suspension": { }
}
```

Backend may wrap as `{ champ: { … } }` or return the champ object directly — mapper accepts both.

### Gaps

- Earnings / Documents / SLA tabs need separate endpoints (not in overview).
- Online toggle / Suspend / Terminate / Message not wired yet.

## App wiring

```
AdminChampDetailPage
  → adminService.getChampDetail(champId)
  → GET /admin/fleet/champs/:champId
  → mapAdminChampDetailResponse
```
