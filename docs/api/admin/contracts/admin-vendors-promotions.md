# Admin Vendors — Promotions

Confirmed from Postman/Hoppscotch screenshots for List, Get (404), and Create.

## List promotions

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/vendors/:vendorId/promotions` |
| Feature | `vendors` |
| UI | Vendor detail → **Promotions** |

### Confirmed success

```json
{
  "success": true,
  "data": {
    "count": 0,
    "promotions": []
  }
}
```

Empty `promotions: []` is valid — show **No promotions** (do not invent rows).

## Get promotion

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/vendors/:vendorId/promotions/:promotionId` |

### Confirmed not found (HTTP 404)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Promotion not found"
  }
}
```

Shown in the View modal error area. Successful get response shape matches create `data` (not separately screenshot-confirmed beyond 404).

## Create promotion

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/vendors/:vendorId/promotions` |

### Confirmed request

```json
{
  "name": "Admin test promo",
  "type": "PERCENT_OFF",
  "discountValue": 10,
  "scope": "all_branches",
  "startsAt": "2024-07-28T21:10:49.871Z",
  "endsAt": "2024-08-03T21:10:49.871Z"
}
```

### Confirmed response `data`

```json
{
  "id": "cm6lzo9b19bv9cm08ot8s",
  "name": "Admin test promo",
  "type": "PERCENT_OFF",
  "value": 10,
  "cap": null,
  "minOrder": null,
  "scope": "all_branches",
  "branchIds": [],
  "from": "2024-07-28T21:10:49.871Z",
  "to": "2024-08-03T21:10:49.871Z",
  "active": true,
  "isPaused": false,
  "status": "Active"
}
```

### UI mapping

| UI | API |
| --- | --- |
| Type `% off` | `PERCENT_OFF` |
| Scope All branches | `all_branches` |
| Value | request `discountValue` / response `value` |
| From / To | request `startsAt`/`endsAt` / response `from`/`to` |
| Cap / Min order | response `cap` / `minOrder` (`null` → `—`) |
| Used | not on create response → `—` |

## Update promotion (Postman sample only)

```json
{ "name": "Admin test promo updated" }
```

Edit modal PATCH currently sends **name** only (confirmed sample). Cap / min order / type / dates are not in that sample.

## App wiring

```
AdminVendorDetailPage → Promotions tab
  → listVendorPromotions
  → New promotion → createVendorPromotion
  → View → getVendorPromotion (404-safe)
  → Edit → updateVendorPromotion ({ name })
```

## Gaps

- Delete promotion not wired in UI.
- Selected branches / non-`PERCENT_OFF` types not fully confirmed beyond UI labels.
- Cap / min order / Active toggle not in confirmed create body (create ignores them).
