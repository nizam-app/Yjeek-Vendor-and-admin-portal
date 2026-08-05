# Admin Fleet — Create champ

Confirmed from Postman **"POST Create champ"** + success response (`201`).

## Create champ

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/fleet/champs` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.fleet.champs` |
| Feature flag | `fleet` |
| UI | `/admin/fleet/new` (`AdminAddChampPage`) |

### Confirmed request body

```json
{
  "firstName": "Ahmed",
  "lastName": "Ali",
  "phone": "33007777",
  "countryCode": "+973",
  "email": "ahmed.champ@example.com",
  "cprNumber": "900101123",
  "allowedCategories": ["Food", "Groceries"],
  "dailyCashLimit": 50,
  "tier": "BRONZE",
  "city": "Manama",
  "zone": "Adliya",
  "vehicleType": "BIKE",
  "vehicleMake": "Honda",
  "vehicleModel": "PCX",
  "vehicleYear": 2025,
  "plateNumber": "MC-45821",
  "supplierId": "{{supplierId}}"
}
```

### Confirmed success `data`

```json
{
  "champ": {
    "header": { "id": "…", "champId": "…", "displayCode": "DRV-54A93D", "name": "Ahmed Ali", "…" },
    "kpis": { "lifetimeDeliveries": 0, "acceptanceRate": 0, "avgRating": 0, "onTimeRate": 0, "cancellationCount": 0 },
    "profile": { "firstName": "Ahmed", "lastName": "Ali", "vehicle": { "type": "BIKE", "…" }, "…" },
    "controls": { "online": false, "zone": "Adliya", "codAmount": 0, "…" },
    "suspension": { "…" }
  },
  "temporaryPassword": "…",
  "passwordResetRequired": true
}
```

Detail navigation uses `champ.header.id`.

### UI → API mapping

| UI field | API field |
| --- | --- |
| Full name (split) | `firstName`, `lastName` |
| Phone (`+973 …`) | `countryCode`, `phone` |
| Email | `email` |
| Supplier (from `GET /admin/fleet/suppliers`) | `supplierId` |
| Tier / City / Zone | `tier`, `city`, `zone` |
| CPR number | `cprNumber` |
| Plate / Make / Model / Year | `plateNumber`, `vehicleMake`, `vehicleModel`, `vehicleYear` |
| Vehicle type Bike/Car | `vehicleType` `BIKE`/`CAR` |
| Allowed store types | `allowedCategories` |
| Daily cash limit (`BHD 50.000`) | `dailyCashLimit` number |

### Gaps (UI fields not sent)

Nationality, CPR/passport/visa/insurance/license expiry, birth date, passport/visa numbers, vehicle color, special-item toggles, per-order cash limit, document uploads — **not in confirmed create body**.

Supplier list envelope for `GET /admin/fleet/suppliers` is not screenshot-confirmed; mapper accepts `suppliers[]` / `items[]` / bare array.

## App wiring

```
AdminAddChampPage
  → adminService.listAdminFleetSuppliers()  (supplierId dropdown)
  → adminService.createAdminFleetChamp(form)
  → POST /admin/fleet/champs
  → mapAdminCreateChampResponse
  → show temporaryPassword, navigate to /admin/fleet/:id
```
