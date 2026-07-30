# Admin Vendors — Create vendor (Add vendor wizard)

Confirmed from Postman **"Create vendor (Add vendor wizard)"** + conflict screenshot (`409 CONFLICT`).

## Create vendor

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/vendors` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.vendors.create` |
| Feature flag | `vendors` |
| UI | Add vendor wizard → Review · **Save draft** / **Activate vendor** |

### Confirmed request body (wizard)

```json
{
  "name": "Green Kitchen Express",
  "legalName": "Green Kitchen Express W.L.L.",
  "storeTypeId": "{{storeTypeId}}",
  "categoryLabel": "Food & Beverage",
  "description": "Fresh healthy meals",
  "logoUrl": "https://cdn.yjeek.com/logos/gke.png",
  "coverUrl": "https://cdn.yjeek.com/covers/gke.jpg",
  "city": "Manama",
  "area": "Seef",
  "crNumber": "CR-123456-1",
  "vatNumber": "200000858300002",
  "branches": [
    {
      "name": "Seef Main",
      "address": "Road 2011, Seef District",
      "area": "Seef",
      "city": "Manama",
      "phone": "+973 1778 8881",
      "latitude": 26.2285,
      "longitude": 50.535,
      "deliveryRadiusKm": 6,
      "minOrderAmount": 3,
      "etaMin": 30,
      "isPrimary": true
    }
  ],
  "owner": {
    "fullName": "Sara Owner",
    "email": "owner@example.com",
    "phone": "17788881",
    "countryCode": "+973",
    "password": "Secret123!"
  },
  "additionalUsers": [],
  "commission": {
    "model": "PERCENT_OF_ORDER",
    "commissionRate": 15,
    "platformServiceFee": 0.3,
    "vatOnCommissionPct": 10
  },
  "sla": {
    "slaModelId": "{{slaModelId}}",
    "serviceModes": {
      "hotFoodOnDemand": true,
      "pickup": true,
      "scheduledDelivery": false,
      "dineIn": false,
      "services": false
    },
    "config": {
      "acceptanceCutoffMin": 2,
      "prepTimeHotFoodMin": 18
    }
  },
  "activate": false
}
```

- `activate: false` → draft
- `activate: true` → live (requires owner + ≥1 branch)

### Confirmed conflict

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "A user with email/phone already exists (owner@greenkitchen.bh)"
  }
}
```

UI surfaces `error.message` on the Review step.

## Activate vendor (draft → live)

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/vendors/:vendorId/activate` |
| Body | `{ "activate": true }` |
| Registry | `endpoints.admin.vendors.activate(vendorId)` |

Create flow prefers embedding `activate` on `POST /admin/vendors`. Separate activate remains available for drafts created earlier.

## Load helpers

| Endpoint | UI use |
| --- | --- |
| `GET /admin/store-types` | Store type dropdown (`storeTypeId`) |
| `GET /admin/sla-models` | SLA model picker (`sla.slaModelId`) |

## UI wiring

| Step | Behavior |
| --- | --- |
| 1 Store info | Local draft + store types load |
| 2 Branches | Local branch editor; draft restored via `wizardDraft` / `savedBranch` |
| 3 Users | Owner fields + local additional users via `savedUser` |
| 4 Commission | Local commission / CR / VAT (sent on create) |
| 5 SLA | Service modes + SLA model id |
| 6 Review | **Save draft** → `activate:false`; **Activate** → uses toggle (`activateImmediately`) |

On success → navigate to `/admin/vendors/:id`.

## UI gaps still skipped

- File upload — logo/cover via URL prompt only
- Full SLA config editor fields beyond acceptance/prep defaults
- Gateway fee % fields — not in confirmed create commission body (kept in UI for edit parity)
- Separate `POST …/activate` after create — only used if creating with `activate:false` then activating later from elsewhere
