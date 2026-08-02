# Vendor Promotions — PATCH Edit

Confirmed from Postman **"9. Promotions → Update (Item / category deal | Free delivery | Buy X Get Y)"**.

## Endpoint

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Path | `/vendor-panel/promotions/:promotionId` |
| Registry | `endpoints.vendor.promotions.update(id)` / `.detail(id)` |
| UI | `/promotions/:promoId/edit` (detail → **Edit**) |
| Service | `promotionService.updatePromotion(id, form)` |

## Bodies (by type)

### Item / category deal — `ITEM_CATEGORY_DEAL`

```json
{
  "name": "Ramadan 20% Off",
  "type": "ITEM_CATEGORY_DEAL",
  "isPaused": false,
  "discountValue": 20,
  "discountUnit": "PERCENT",
  "maxDiscountCap": 3,
  "minOrderAmount": 5,
  "showDealBadge": true,
  "appliesTo": "SELECTED_CATEGORIES",
  "categoryIds": ["{{categoryId}}"],
  "applyToAllBranches": true,
  "startsAt": "2026-03-22T00:00:00.000Z",
  "endsAt": "2026-03-30T23:59:59.000Z",
  "noEndDate": false,
  "totalUsageLimit": 1000,
  "usesPerCustomer": 1
}
```

### Free delivery — `FREE_DELIVERY`

```json
{
  "name": "Free Delivery Weekend",
  "type": "FREE_DELIVERY",
  "isPaused": false,
  "waiveDeliveryFee": true,
  "minOrderAmount": 5,
  "firstOrderOnly": false,
  "applyToAllBranches": true,
  "startsAt": "2026-03-22T00:00:00.000Z",
  "endsAt": "2026-03-30T23:59:59.000Z",
  "noEndDate": false,
  "totalUsageLimit": 1000,
  "usesPerCustomer": 1
}
```

### Buy X Get Y — `BUY_X_GET_Y`

```json
{
  "name": "Buy 1 Get 1 Burger",
  "type": "BUY_X_GET_Y",
  "isPaused": false,
  "buyQuantity": 1,
  "getQuantity": 1,
  "bogoRewardType": "FREE",
  "productIds": ["{{productId}}"],
  "rewardProductIds": ["{{productId}}"],
  "discountCheapestItem": true,
  "limitOneRewardPerOrder": true,
  "applyToAllBranches": true,
  "startsAt": "2026-03-22T00:00:00.000Z",
  "endsAt": "2026-03-30T23:59:59.000Z",
  "noEndDate": false,
  "totalUsageLimit": 1000,
  "usesPerCustomer": 1
}
```

## Notes

- Edit form loads via analytics/detail, then Save PATCHes the type-specific body.
- Promo type tabs are locked while editing (type comes from the existing promotion).
- Create (`/promotions/new`) still has no confirmed POST create wiring.
