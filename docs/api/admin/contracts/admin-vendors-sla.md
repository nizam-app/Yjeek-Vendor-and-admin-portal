# Admin Vendors — SLA

Confirmed from Postman **"Get SLA (rules + 30d compliance)"** response screenshot (partial scroll).

## Get SLA

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/vendors/:vendorId/sla` |
| Feature | `vendors` |
| UI | Vendor detail → **SLA** |

### Confirmed `data` fields (visible in screenshot)

```json
{
  "serviceModes": {
    "dineIn": false,
    "pickup": true,
    "scheduledDelivery": true,
    "services": false
  },
  "config": {
    "acceptanceCutoffMin": 2,
    "prepTimeHotFoodMin": 10,
    "readyOnlineTargetPct": 90,
    "handoverToChampMin": 4,
    "dailyOrderCutoff": "23:30",
    "kitchenClose": "23:45",
    "kpiWeights": {
      "accuracy": 20,
      "packing": 5,
      "prepTime": 25,
      "reliability": 50
    },
    "serviceModes": [{ "hotFoodOnDemand": true }]
  }
}
```

Notes:
- Top of response (model name / `slaModelId` / `hotFoodOnDemand` in `serviceModes`) was scrolled off-screen — mapper reads them when present.
- Ready target key may appear as `readyOnlineTargetPct` / `readyOnlineMarginPct` / `readyTimeBufferPct` — all accepted.
- Compliance (30d) was not visible in the screenshot — mapped when present; otherwise UI shows **No compliance data** (not invented).

### UI mapping

| UI | Source |
| --- | --- |
| Metrics cards | `config.acceptanceCutoffMin`, `prepTimeHotFoodMin`, ready %, `handoverToChampMin` |
| SLA rules | same + `dailyOrderCutoff`, `kitchenClose` |
| VPI weighting | `config.kpiWeights.*` |
| Compliance chips | `compliance` / `compliance30d` when present |

## Update SLA

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Path | `/admin/vendors/:vendorId/sla` |

### Confirmed Postman sample

```json
{
  "slaModelId": "{{slaModelId}}",
  "serviceModes": {
    "hotFoodOnDemand": true,
    "pickup": true
  },
  "config": {
    "acceptanceCutoffMin": 2,
    "prepTimeHotFoodMin": 18
  }
}
```

**Change model** / **Edit SLA** buttons are not wired yet (no edit modal confirmed).

## App wiring

```
AdminVendorDetailPage (SLA tab)
  → adminService.getVendorSla
  → mapAdminVendorSlaResponse
  → AdminVendorSla
```

## Gaps

- Edit / Change model UI not connected to PATCH.
- Add-vendor wizard step 5 still unwired.
- Full response envelope (model name, compliance object) preferred for a tighter header/meta.
