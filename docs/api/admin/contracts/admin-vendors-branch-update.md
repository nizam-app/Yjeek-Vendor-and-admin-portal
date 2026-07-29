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
- `GET /admin/vendors/:vendorId/delivery-zones` — vendor delivery contribution defaults

### Body (confirmed sample)

```json
{ "etaMin": 35 }
```

Partial update. FE also sends editable branch fields when present:

`name`, `area`, `address`, `phone`, `latitude`, `longitude`, `radiusKm`, `minOrder`, `etaMin`

### Apply to all (toggle on Branch setup)

When **Apply these delivery settings to all branches** is on:

1. `PATCH /admin/vendors/:vendorId/delivery-zones` — save vendor defaults from form
2. `POST /admin/vendors/:vendorId/delivery-zones/apply-all`

### Success

Same list envelope as list/create: `{ count, branches[] }`.

## UI gaps (not in branch PATCH)

- **Working hours** day cards — API only has string `hours` (e.g. `"08:00–23:00"`)
- **Customer delivery details** section — no confirmed API on this page
- **Force close** on Branch setup — local UI only (use vendor force-close API separately)
- **Phone** — accepted by API but not on this form
