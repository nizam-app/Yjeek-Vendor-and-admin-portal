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
  "name": "Green Kitchen test",
  "legalName": "Green Kitchen Express W.L.L.",
  "storeTypeId": "{{storeTypeId}}",
  "categoryLabel": "Food & Beverage",
  "description": "Fresh healthy meals",
  "logoUrl": "https://cdn.yjeek.com/logos/gke.png",
  "coverUrl": "https://cdn.yjeek.com/covers/gke.jpg",
  "city": "Manama",
  "area": "Seef",
  "crNumber": "CR-123456-1",
  "vatNumber": "200000898300002",
  "branches": [
    {
      "name": "Seef Main",
      "address": "Road 2811, Seef District",
      "area": "Seef",
      "city": "Manama",
      "phone": "+973 1770 003",
      "latitude": 26.2285,
      "longitude": 50.535,
      "deliveryRadiusKm": 6,
      "minOrderAmount": 3,
      "etaMin": 30,
      "isPrimary": true
    }
  ],
  "owner": {
    "fullName": "Sara alii",
    "email": "owner@greenkitchentest.bh",
    "phone": "39001122",
    "countryCode": "+973",
    "password": "Owner@12345"
  },
  "additionalUsers": [
    {
      "displayName": "Branch Manager Bob",
      "email": "bob@greenkitchen.bh",
      "phone": "38001122",
      "password": "Manager@123",
      "role": "BRANCH_MANAGER",
      "branchIndex": 0
    }
  ],
  "commission": {
    "model": "TIERED",
    "commissionTiers": [
      { "fromAmount": 0, "ratePct": 18 },
      { "fromAmount": 5000, "ratePct": 15 },
      { "fromAmount": 15000, "ratePct": 12 }
    ],
    "customFees": [
      { "name": "Marketing fee", "amount": 0.1, "type": "BHD" }
    ],
    "platformServiceFee": 0.3,
    "vatOnCommissionPct": 10
  },
  "sla": {
    "slaModelId": "{{slaModelId}}",
    "serviceModes": {
      "hotFoodOnDemand": true,
      "pickup": true,
      "scheduledDelivery": true,
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
- Owner `phone` is local digits; `countryCode` is separate (`+973`)
- Additional user `phone` is local digits (no country prefix)
- `additionalUsers` is always sent (may be `[]`)

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
| 1 Store info | Local draft + store types load; `categoryLabel` separate from store type name |
| 2 Branches | Local branch editor; draft restored via `wizardDraft` / `savedBranch` |
| 3 Users | Owner fields + local additional users (`password`, `phone` digits, `branchIndex`) |
| 4 Commission | Tiered editor (`commissionTiers`) + custom fees + platform/VAT |
| 5 SLA | Service modes (incl. scheduled) + SLA model id + acceptance/prep |
| 6 Review | **Save draft** → `activate:false`; **Activate** → uses toggle (`activateImmediately`) |

On success → navigate to `/admin/vendors/:id`.

## UI gaps still skipped

- File upload — logo/cover via URL prompt only
- Full SLA config editor fields beyond acceptance/prep defaults
- Gateway fee % fields — not in confirmed create commission body (kept in UI for edit parity)
- Separate `POST …/activate` after create — only used if creating with `activate:false` then activating later from elsewhere
