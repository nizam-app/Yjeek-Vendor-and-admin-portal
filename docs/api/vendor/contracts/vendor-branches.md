# Vendor Branches API contract

Confirmed from Postman screenshots. Real IDs, phones, and addresses are redacted.

## List branches

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/branches` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.branches` |

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "count": 7,
    "branches": [
      {
        "id": "<redacted>",
        "name": "<redacted>",
        "address": "<redacted>",
        "area": "<redacted>",
        "city": "<redacted>",
        "phone": "<redacted>",
        "radiusKm": 5,
        "minOrderAmount": 3,
        "etaMin": 30,
        "status": "OPEN",
        "operationalStatus": "OPEN",
        "isSuspended": false,
        "suspensionReason": null,
        "openingHours": null,
        "isPrimary": true
      }
    ]
  }
}
```

## Get branch

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/branches/:branchId` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.branch(branchId)` |

Returns a single branch object in `data` (same fields as a list item). May include `openingHours`.

## Update branch

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Relative path | `/vendor-panel/branches/:branchId` |
| Auth | Protected — Bearer via `apiClient` |
| Postman | `PATCH Update branch` |

### Confirmed request body

```json
{
  "name": "<string>",
  "address": "<string>",
  "phone": "<string>",
  "deliveryRadiusKm": 5,
  "etaMin": 12,
  "minOrderAmount": 3,
  "openingHours": {
    "mon": { "open": "09:00", "lastOrder": "22:30", "close": "23:00" },
    "tue": { "open": "09:00", "lastOrder": "21:30", "close": "22:00" },
    "wed": { "open": "09:00", "lastOrder": "22:30", "close": "23:00" },
    "thu": { "open": "09:00", "lastOrder": "22:30", "close": "23:00" },
    "fri": "closed",
    "sat": { "open": "10:00", "lastOrder": "23:30", "close": "00:00" },
    "sun": { "open": "09:00", "lastOrder": "22:30", "close": "23:00" }
  }
}
```

Notes:

- Request uses `deliveryRadiusKm`; success payload exposes `radiusKm`.
- Closed days are the string `"closed"`.
- API hours are single-shift only (`open` / `lastOrder` / `close`). UI split shifts are flattened to first-open → last-close when saving; `lastOrder` is derived as 30 minutes before `close`.

### Success (HTTP 200)

Returns the updated branch object in `data`.

## Delete branch

| Field | Value |
| --- | --- |
| Method | `DELETE` |
| Relative path | `/vendor-panel/branches/:branchId` |
| Auth | Protected — Bearer via `apiClient` |
| Postman | `DELETE Delete Branch` |
| Registry | `endpoints.vendor.branch(branchId)` |

## Get branch menu

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/catalog/branches/:branchId/menu` |
| Auth | Protected — Bearer via `apiClient` |
| Postman | `GET Branch menu` |
| Registry | `endpoints.vendor.catalog.branchMenu(branchId)` |

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "menu": [
      {
        "id": "<categoryId>",
        "name": "Main Course",
        "type": "category",
        "isVisible": true,
        "children": [
          {
            "id": "<productId>",
            "name": "Classic Burger",
            "type": "product",
            "isAvailable": true,
            "product": {
              "nameAr": "<string>",
              "description": "<string>",
              "price": 3.5
            }
          }
        ]
      }
    ]
  }
}
```

Category nodes may nest further (subcategory / type). Product leaves use `type: "product"`.

## Edit branch menu

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Relative path | `/vendor-panel/catalog/branches/:branchId/menu` |
| Auth | Protected — Bearer via `apiClient` |
| Postman | `PATCH Edit Branch menu` |

### Confirmed request body

```json
{
  "items": [
    { "productId": "<id>", "isAvailable": true, "priceOverride": 3.2 },
    { "productId": "<id>", "isAvailable": false }
  ],
  "categories": [
    { "categoryId": "<id>", "isVisible": true }
  ]
}
```

`priceOverride` is optional per item. Confirmed item fields also include `isVisible`.
`categories` sends `categoryId` + `isVisible` for real catalog category/subcategory nodes only.
Synthetic buckets such as `Uncategorized` are never sent (they are not Category rows and cause `branch_category_visibility_category_id_fkey` failures).

Product display mapping (GET response → UI):

| UI | Source |
| --- | --- |
| Price | `product.effectivePrice` (fallback `product.price`) |
| Available | `product.branchIsAvailable` |
| Visible | `product.branchIsVisible` / node `isVisible` |
| Locked toggle | `product.lockedByCategory` |

### Success (HTTP 200)

Same menu tree shape as Get branch menu.

## Set branch status

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Relative path | `/vendor-panel/branches/:branchId/status` |
| Auth | Protected — Bearer via `apiClient` |
| Postman | `Set status OPEN` (and equivalent Busy/Closed) |

### Request body

```json
{
  "status": "OPEN"
}
```

Confirmed API enum values used by the Branches card buttons and Topbar Open/Close rows:

| UI button | API `status` |
| --- | --- |
| Open | `OPEN` |
| Busy | `BUSY` |
| Closed | `CLOSED` |

### Success (HTTP 200)

Returns the updated branch object in `data`, including `status` and `operationalStatus` (e.g. `"OPEN"`).

Suspended branches cannot self-change status in the UI (no status buttons / Topbar shows Suspended).

## Close all branches

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Relative path | `/vendor-panel/branches/close-all` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.branchesCloseAll` |
| UI | Topbar → **Close all branches** |

### Request body

Empty object `{}` (no confirmed body fields).

### Success (HTTP 200)

Same list shape as List branches — `data.count` + `data.branches[]`, with branch `status` / `operationalStatus` set to `"CLOSED"`.

## Open all branches

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Relative path | `/vendor-panel/branches/open-all` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.branchesOpenAll` |
| UI | Topbar → **Open all branches** |

### Request body

Empty object `{}` (no confirmed body fields).

### Success (HTTP 200)

Same list shape as List branches — `data.count` + `data.branches[]`, with branch `status` / `operationalStatus` set to `"OPEN"`.

## Frontend mapping

| UI field | Source |
| --- | --- |
| `name` | `name` |
| `address` | `address` |
| `phone` | `phone` |
| `radius` | `` `${radiusKm} km` `` |
| `eta` | `` `${etaMin} min` `` |
| `minOrder` | formatted `minOrderAmount` |
| `status` | Suspended if `isSuspended`, else OPEN/BUSY/CLOSED → Open/Busy/Closed |
| Working hours | `openingHours` ↔ EditBranch day cards |
| Branch menu | `menu[]` tree → availability / visibility toggles |

## Unconfirmed

- Create branch
- Exact `categories[]` field names beyond `categoryId` / `isVisible` (inferred from `items[].productId` pattern)
- Split-shift persistence (API is single open/close only)

## Modes

| Flag | Behavior |
| --- | --- |
| `VITE_VENDOR_USE_MOCK_API=true` | Mock branches + status + close-all + open-all + update hours + delete + branch menu |
| `VITE_VENDOR_USE_MOCK_API=false` | Real list/get/update/delete/set-status/close-all/open-all/menu |
| Admin | Untouched |
