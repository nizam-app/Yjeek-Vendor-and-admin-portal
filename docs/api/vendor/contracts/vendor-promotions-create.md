# Vendor Promotions — POST Create

Confirmed from Postman **"8. Promotions → POST Create"**.

## Endpoint

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/vendor-panel/promotions` |
| Registry | `endpoints.vendor.promotions.create` (same path as list) |
| UI | `/promotions/new` → **Configure promotion** → Save |
| Service | `promotionService.createPromotion(form)` |

## Minimal body (Postman)

```json
{
  "name": "Free delivery weekend"
}
```

Backend may default `type` to `FREE_DELIVERY` and set schedule fields. Prefer sending a full type body (same shape as Update) from the configure form.

## Full body

Reuse the same fields as [vendor-promotions-update.md](./vendor-promotions-update.md) (`ITEM_CATEGORY_DEAL` | `FREE_DELIVERY` | `BUY_X_GET_Y`).

## Response

`201 Created` with promotion object under `data` (id, name, type, status, startsAt, endsAt, …).
