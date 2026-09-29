# Admin Vendors — Update branch

Confirmed from Postman **"PATCH Update branch"**.

## Update branch

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Path | `/admin/vendors/:vendorId/branches/:branchId` |
| Feature | `vendors` |
| UI | Branches → Edit → Branch setup → Save changes |

### Load

- `GET /admin/vendors/:vendorId/branches` — find branch by id for form
- `GET /admin/vendors/:vendorId/locations/:locationId/delivery-settings` — branch delivery settings (modes, fees, vehicles, driver rates)

### Body (confirmed sample)

```json
{ "etaMin": 35 }
```

Partial update. FE also sends editable branch fields when present:

`name`, `area`, `address`, `phone`, `latitude`, `longitude`, `radiusKm`, `minOrder`, `etaMin`

### Success

Same list envelope as list/create: `{ count, branches[] }`.

## UI gaps (not in branch PATCH)

- **Working hours** day cards — API only has string `hours` (e.g. `"08:00–23:00"`)
- **Delivery fees / modes** — `GET` + `PUT` `/admin/vendors/:vendorId/locations/:locationId/delivery-settings` (saved from **Status & controls › Delivery Settings**, not branch PATCH)
- **Force close / Reopen** on Branch setup — uses `POST .../force-close` and `POST .../reopen` with `scope: "single_branch"` + `branchId`
- **Phone** — accepted by API but not on this form
