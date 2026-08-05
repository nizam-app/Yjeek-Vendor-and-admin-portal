# Admin Fleet — Create supplier

Confirmed from Postman **"POST Create supplier"** + `201` response.

## Create supplier

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/fleet/suppliers` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.fleet.suppliers` |
| Feature flag | `fleet` |
| UI | `/admin/fleet/suppliers/new` (`AdminAddSupplierPage`) |

### Confirmed request body

```json
{
  "name": "SpeedX",
  "type": "THIRD_PARTY",
  "contactPerson": "Ahmed Ali",
  "phone": "+973 3300 1122",
  "email": "ops@speedx.com",
  "city": "Manama",
  "commissionPct": 12
}
```

### UI → API

| UI | API |
| --- | --- |
| Supplier name | `name` |
| Type In-house / 3PL | `IN_HOUSE` / `THIRD_PARTY` |
| City | `city` (added — required by API, was missing from original mock form) |
| Commission % | `commissionPct` (added — required by API) |
| Contact person / Phone / Email | same |

### Confirmed success `data`

Returns the created supplier object (`id`, `name`, `type`, `status: ACTIVE`, `champCount: 0`, …). Navigate to `/admin/fleet/suppliers/:id`.

## App wiring

```
AdminAddSupplierPage
  → adminService.createAdminFleetSupplier(form)
  → POST /admin/fleet/suppliers
  → mapAdminCreateSupplierResponse
  → /admin/fleet/suppliers/:id
```
