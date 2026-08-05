# Admin Marketing — Promo codes list

Confirmed from Postman **12. Marketing → List promo codes**.

## List promo codes

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/marketing/promo-codes` |
| Query | `status=all`, `limit=20` |
| Feature | `marketing` |

List response embeds `summary` KPIs (no separate summary call required for this tab).

| UI KPI | Source |
| --- | --- |
| Active codes | `summary.activeCodes` |
| Redemptions (30d) | `summary.redemptions30d` |
| Discount given | `summary.discountGiven` → `BHD …` |
| Revenue from codes | `summary.revenueFromCodes` → `BHD …` |

| UI column | Source |
| --- | --- |
| Code | `code` |
| Description | `description` |
| Type | `typeLabel` |
| Max disc. | `maxDiscLabel` |
| Used / limit | `usedLimitLabel` |
| Status | `status` |
| Expiry | `expiryLabel` |

## Create promo code

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/marketing/promo-codes` |
| Feature | `marketing` |

### Confirmed body

```json
{
  "code": "WELCOME50D",
  "description": "50% off first order",
  "discountType": "PERCENT",
  "discountValue": 50,
  "maxDiscountAmount": 2,
  "maxUses": 1000,
  "isActive": true
}
```

| UI field | API |
| --- | --- |
| Code | `code` |
| Description | `description` |
| Discount type | `discountType` (`PERCENT` · `FIXED` · `FREE_DELIVERY` · `BOGO`) |
| Discount value | `discountValue` |
| Max discount (cap) | `maxDiscountAmount` (parses `BHD 2`) |
| Total usage limit | `maxUses` |
| — | `isActive: true` |

### UI-only (not in confirmed create body)

Min order, per-customer limit, audience, valid from/to, scope/vendors, channels — still local until backend adds them.

## Not wired yet

- Update (pause) / Get promo code detail
- Dedicated `GET /admin/marketing/promo-codes/summary` (list already includes summary)

## Files

- `src/mappers/admin/mapAdminMarketingPromoCodes.js`
- `src/services/admin/marketingService.js`
- `AdminMarketingPage.jsx`
