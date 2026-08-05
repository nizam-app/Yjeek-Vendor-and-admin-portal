# Admin Vendors — Commission & fees

Confirmed from Postman **"Get commission & fees"**, **"Update commission (percent)"**, and **"Update commission (tiered + custom fees)"** response screenshots.

## Get commission

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/vendors/:vendorId/commission` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.vendors.commission(vendorId)` |
| Feature flag | `vendors` |
| UI | Vendor detail → **Commission & fees**; Edit vendor wizard → step 4 |

### Confirmed success `data`

```json
{
  "model": "PERCENT_OF_ORDER",
  "commissionRate": 15,
  "flatFeePerOrder": null,
  "commissionTiers": [],
  "customFees": [],
  "platformServiceFee": 0.3,
  "vatOnCommissionPct": 10,
  "currency": "BHD",
  "gatewayFees": {
    "fixedPct": 1,
    "debitPct": 0.5,
    "creditPct": 2,
    "applePayPct": 1.5,
    "googleWalletPct": 1.5,
    "otherChargesPct": 0.5,
    "fixedCharge": 0.05
  }
}
```

Empty `commissionTiers` / `customFees` are valid — do not invent rows on load.

## Update commission (percent)

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Path | `/admin/vendors/:vendorId/commission` |

### Confirmed request

```json
{
  "model": "PERCENT_OF_ORDER",
  "commissionRate": 15
}
```

### Confirmed response `data`

Same full shape as GET (including `gatewayFees`, `platformServiceFee`, `vatOnCommissionPct`, empty tiers/fees).

## Update commission (tiered + custom fees)

### Confirmed request

```json
{
  "model": "TIERED",
  "commissionTiers": [
    { "fromAmount": 0, "ratePct": 10 },
    { "fromAmount": 5000, "ratePct": 15 }
  ],
  "customFees": [
    { "name": "Packaging fee", "amount": 0.85, "type": "BHD" }
  ]
}
```

### Confirmed response `data` (partial fields shown in screenshot)

```json
{
  "model": "TIERED",
  "commissionRate": 15,
  "flatFeePerOrder": null,
  "commissionTiers": [
    { "ratePct": 10, "fromAmount": 0 },
    { "ratePct": 15, "fromAmount": 5000 }
  ],
  "customFees": [
    { "name": "Packaging fee", "type": "BHD", "amount": 0.85 }
  ]
}
```

## UI mapping

### Vendor detail summary

| UI | Source |
| --- | --- |
| Model | `PERCENT_OF_ORDER` → `% of order` (`TIERED` → Tiered; `FLAT_PER_ORDER` → Flat per order) |
| Commission rate | `commissionRate` → `15%` |
| Platform service fee | `platformServiceFee` → `BHD 0.300` |
| VAT on commission | `vatOnCommissionPct` → `10%` |

### Edit vendor · Commission & fees (wizard step 4)

| UI | Source / save |
| --- | --- |
| Commission model | GET `model` / PATCH `model` |
| Commission rate (%) | GET `commissionRate` / PATCH percent `commissionRate` |
| Platform service fee | GET `platformServiceFee` |
| VAT on commission | GET `vatOnCommissionPct` → `10% (auto)` |
| Currency | GET `currency` → `BHD (fixed)` |
| Gateway fee fields | GET `gatewayFees.*` |
| Custom fees list | GET `customFees[]` (empty → “No custom fees”); Tiered PATCH `customFees` |
| Commission tiers (read-only list) | GET `commissionTiers[]` when model is Tiered |

Wizard **Save draft** / **Continue** on step 4 → `PATCH` via `mapAdminWizardCommissionRequest`.

## App wiring

```
AdminVendorDetailPage (Commission & fees tab)
  → getVendorCommission / updateVendorCommission

AdminAddVendorPage (edit · step 4)
  → getVendorCommission on load
  → updateVendorCommission({ wizard: true, customFees, commissionTiers })
```

## Gaps

- **Documents & compliance** (CR / VAT numbers) are on the step-4 UI but **not** in the commission API — not saved with this step.
- Wizard has **no tier editor**; loaded tiers are shown read-only. If Tiered is saved with no tiers, FE seeds `[{ fromAmount: 0, ratePct: <rate field> }]` so the confirmed Tiered body shape is valid.
- Custom fees are included in the confirmed **Tiered** PATCH. For `% of order` / Flat they stay local only.
- `FLAT_PER_ORDER` inferred from `flatFeePerOrder` (not in percent/tiered Postman samples).
- Add-vendor (create) flow still unwired — edit mode only when `vendors` feature is on.
