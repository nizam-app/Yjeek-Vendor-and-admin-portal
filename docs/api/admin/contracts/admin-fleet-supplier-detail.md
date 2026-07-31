# Admin Fleet — Supplier detail & performance

Confirmed from Postman **"Supplier detail & performance"** + response sample.

## Get supplier

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/fleet/suppliers/:supplierId` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.fleet.supplier` |
| Feature flag | `fleet` |
| UI | `/admin/fleet/suppliers/:supplierId` |

### Confirmed query

| Param | Example | Notes |
| --- | --- | --- |
| `from` | `2026-06-01T00:00:00.000Z` | Performance window start |
| `to` | `2026-06-30T23:59:59.000Z` | Performance window end |

UI defaults to the current UTC month when omitted.

### Confirmed success `data`

```json
{
  "supplier": {
    "id": "…",
    "name": "RapidGo",
    "displayCode": "SUP-3PL-03",
    "type": "THIRD_PARTY",
    "contactPerson": "Sara Noor",
    "phone": "+973 3300 3344",
    "email": "ops@rapidgo.bh",
    "city": "Riffa",
    "commissionPct": 14,
    "rating": 4.5,
    "status": "ACTIVE",
    "champCount": 2,
    "joinedAt": "…"
  },
  "metrics": {
    "totalChamps": 2,
    "onlineChamps": 0,
    "deliveries7d": 0,
    "onTimeRate": 0,
    "avgRating": 0,
    "acceptanceRate": 0
  },
  "sampleChamps": [
    {
      "id": "…",
      "name": "Ahmed Ali",
      "displayCode": "DRV-54A93D",
      "phone": "+973 33007777",
      "vehicle": "BIKE",
      "statusLabel": "Offline",
      "tier": "BRONZE"
    }
  ],
  "performance": {
    "from": "…",
    "to": "…",
    "deliveries": 0,
    "completionRate": 0,
    "avgDeliveryTimeMin": null,
    "cancellations": 0,
    "onTimeRate": 0,
    "rating": 4.5,
    "commissionPct": 14
  }
}
```

### UI mapping

| UI | API |
| --- | --- |
| Header name / code / city / rating | `supplier.*` |
| Type badge | `THIRD_PARTY`→3PL, `IN_HOUSE`→In-house |
| KPI cards | `metrics.totalChamps`, `onlineChamps`, `deliveries7d`, `onTimeRate` |
| Supplier info | contact / phone / email / joinedAt / type / status |
| Champs table | `sampleChamps[]` |
| Performance cards | `performance.deliveries`, `completionRate`, `avgDeliveryTimeMin`, `cancellations`, `onTimeRate` |

### Gaps

- `sampleChamps` has **no zone** — Zone column shows `—`.
- `metrics.avgRating` / `acceptanceRate` and `performance.rating` / `commissionPct` not shown as separate cards (header uses `supplier.rating`).
- Edit / Deactivate / Activate / period picker mutation not wired yet.
- List suppliers envelope still not fully screenshot-confirmed (mapper accepts flexible shapes).

## App wiring

```
AdminSupplierDetailPage
  → adminService.getAdminFleetSupplier(id, { from, to })
  → GET /admin/fleet/suppliers/:id
  → mapAdminSupplierDetailResponse
```
