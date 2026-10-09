# Admin — Vendor branch driver rates (effective at checkout)

**GET** `/admin/vendors/:vendorId/delivery-settings/branch-driver-rates`

Permission: `VENDOR_MANAGEMENT` · `VIEW`

Returns **effective** on-demand Champ driver rates for each **active** branch, using the same resolution order as order payout:

1. Branch `deliverySettingsV1.driverRates`
2. Vendor template `deliverySettingsV1.driverRates`
3. Store-type commercial defaults

Live checkout and Champ pay always read the **branch** row first; this endpoint surfaces what that resolution produces per branch.

## Response `data`

```json
{
  "checkoutSource": "branch",
  "activeBranchCount": 1,
  "branches": [
    {
      "locationId": "clx…",
      "name": "Adliya",
      "isPrimary": true,
      "ratesSource": "branch",
      "onDemand": {
        "bikeBase": 0.8,
        "carBase": 0.85,
        "freeRadiusKm": 10,
        "extraPerKm": 0.075
      }
    }
  ],
  "templateOnDemand": {
    "bikeBase": 0.8,
    "carBase": 0.85,
    "freeRadiusKm": 10,
    "extraPerKm": 0.075
  },
  "templateMatchesSingleBranch": true
}
```

| Field | Meaning |
|-------|---------|
| `ratesSource` | Which layer supplied the effective rates for that branch (`branch`, `vendor_template`, `store_type`). |
| `templateMatchesSingleBranch` | `true` / `false` when `activeBranchCount === 1`; otherwise `null`. |
| `templateOnDemand` | Flattened vendor template on-demand rates (for comparison). |

## Single-branch sync

When a vendor has exactly one active branch, saving branch delivery settings with `driverRates` also updates the vendor template `driverRates` (server-side). Multi-branch vendors are not auto-synced; use push-to-branches from the vendor template after editing.

## Manual QA

1. **Single branch:** Set bike 0.800 / car 0.850 on branch setup → vendor Delivery tab summary and template show 0.800 / 0.850; `templateMatchesSingleBranch` is true.
2. **Multi-branch:** Different rates on two branches appear as two summary rows; saving branch B does not change vendor template unless pushed.
3. **Order economics:** Placed order driver pay matches branch effective bike/car base inside free radius.
4. **Push:** Vendor template push overwrites branch driver rates after confirm modal.
