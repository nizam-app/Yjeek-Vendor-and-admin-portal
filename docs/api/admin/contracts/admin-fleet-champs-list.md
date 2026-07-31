# Admin Fleet — List champs

Confirmed from Postman **"GET List champs (tabs + filters)"** response screenshot.

## List champs

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/fleet/champs` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.fleet.champs` |
| Feature flag | `fleet` |
| UI | `/admin/fleet` table + tabs/filters |

### Confirmed query (Postman)

| Param | Example | Notes |
| --- | --- | --- |
| `search` | `` | Free-text search |
| `statusTab` | `all` | UI tabs → `all` / `online` / `on_delivery` / `offline` / `suspended` |
| `vehicle` | `BIKE` | Also `CAR`; omit when “Vehicle” = all |
| `tier` | `GOLD` | `ELITE` / `GOLD` / `SILVER` / `BRONZE` / `AT_RISK` |
| `category` | `Food` | e.g. Food / Groceries / Pharmacy |
| `limit` | `20` | |

### Confirmed success envelope

```json
{
  "page": 1,
  "limit": 20,
  "total": 0,
  "champs": []
}
```

Empty `champs: []` is valid → UI shows **No champs found.**

### Gaps / inferred row fields

**No sample champ object was returned.** Row mapping is inferred from Create champ response (`header` / `profile`) + UI columns:

| UI column | Inferred sources |
| --- | --- |
| Champ name | `header.name` / `displayName` / `firstName+lastName` |
| Champ ID | `header.displayCode` / `code` / `id` |
| Supplier | `header.supplier.name` / `supplierName` |
| Contact | `header.phone` / `countryCode+phone` |
| CPR | `profile.cprNumber` / `cprNumber` |
| Vehicle | `profile.vehicle.type` / `vehicleType` (`BIKE`→Bike) |
| Allowed categories | `profile.allowedCategories[]` (first 2 + `+N`) |
| Daily cash limit | `profile.dailyCashLimit` → `BHD x.xxx` |
| Status | `header.statusLabel` / `status` (`ON_DELIVERY`→On delivery) |
| Tier | `header.tier` / `profile.tier` (`GOLD`→Gold) |

If a live non-empty `champs[]` sample differs, update `mapAdminFleetChampListItem`.

## App wiring

```
AdminFleetPage
  → adminService.listAdminFleetChamps({ search, statusTab, vehicle, tier, category, limit })
  → GET /admin/fleet/champs (+ GET /admin/fleet/summary for KPI cards)
  → mapAdminFleetChampsListResponse
```
