# Admin Vendors — Delivery zones

Confirmed from Postman **"GET Get delivery zones (map coverage)"**.

## Get delivery zones

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/vendors/:vendorId/delivery-zones` |
| Feature | `vendors` |
| UI | Vendor detail → Delivery zones |

Coverage map uses `coverage.circles` on Google Maps (`VITE_GOOGLE_MAPS_API_KEY`). Branches with `(0,0)` coords are skipped.

### Success `data` (confirmed)

- `general` → still returned by API; fee defaults are edited on **Vendor delivery details** (`/delivery-settings`) and each branch’s **Delivery Settings**, not on this tab
- `branches[]` → Per-branch overrides table  
  `id`, `name`, `radiusKm`, `etaMin`, `minOrder`, `deliveryFee`
- `coverage` → Coverage map summary  
  `center`, `circles[]` (`branchId`, `name`, `latitude`, `longitude`, `radiusKm`)

## Apply to all branches

Use **Vendor delivery details** → push to branches (`POST /admin/vendors/:vendorId/delivery-settings/push-to-branches`), not the legacy delivery-zones apply-all button (removed from Delivery zones tab UI).

### PATCH body (legacy `general` defaults)

Sends general fields when set, e.g.:

```json
{
  "deliveryRadiusKm": 5,
  "deliveryEtaMin": 30,
  "minOrderAmount": 3,
  "deliveryContribution": 0.3,
  "freeDeliveryOver": 8,
  "freeDeliveryEnabled": true,
  "maxDistanceKm": 8,
  "extraContributionPerKm": 0.1,
  "maxContribution": 0.8
}
```

### Apply-all success (confirmed)

Same as GET: branches inherit radius / ETA / min order from general (e.g. `radiusKm: 5`, `etaMin: 30`, `minOrder: 3`).

## Related (not fully wired in UI yet)

- `PATCH /delivery-zones/branches/:branchId` — single-branch override (`deliveryFee` sample)
