# Vendor Catalog — catalog-scoped products

Confirmed backend contract (2026-08-03). Envelope `{ success, data }`.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/vendor-panel/catalog/store-types` | Vendor-assigned catalogs only + `productCount` |
| `GET` | `/vendor-panel/catalog/store-types/:id/badges` | StoreTypeBadge list (`label`, `code`) |
| `GET` | `/vendor-panel/catalog/categories?platformCategoryId=` | Menu category tree |
| `GET` | `/vendor-panel/catalog/products?platformCategoryId=` | Alias `storeTypeId`; excludes null-platform |
| `GET` | `/vendor-panel/catalog/products/:id` | Edit hydrate |
| `POST` | `/vendor-panel/catalog/products` | Requires `platformCategoryId` |
| `PATCH` | `/vendor-panel/catalog/products/:id` | Partial update; optionGroups upsert-by-id |
| `POST` | `/vendor-panel/catalog/uploads/images` | Multipart field `file` → `data.url` |

## Product images

Confirmed flow:

1. `POST /vendor-panel/catalog/uploads/images` with multipart field **`file`** (JPEG/PNG/WebP, max 5 MB).
2. Response: `{ success, data: { url } }` (use `data.url` as stored value).
3. Create/Update product JSON includes `imageUrl` (main) + `imageUrls` (all, main first).
4. List/detail GET returns `imageUrl` + `imageUrls`.

Frontend notes:

- Upload before create/update; do not soft-skip failed uploads.
- Catalog list/grid uses `imageUrl` / `imageUrls[0]` via `getProductImage` + `resolveAdminMediaUrl` (rewrites absolute `/uploads/...` for Vite proxy).
- Placeholder asset only when no remote URL is present.

## Field names

- Catalog: `platformCategoryId` (aliases `storeTypeId`, `categoryId`)
- Leaf category: `catalogCategoryId` (store-type menu tree leaf)
- Options: `optionGroups[].choices`, `priceDelta`, `selectionType` (`SINGLE`\|`MULTIPLE`), `min`/`max`
- Add-ons: `addons[].price` (not `addOns`)
- Images: `imageUrl`, `imageUrls`

## Frontend routes

- `/catalog` — vendor catalogs
- `/catalog/:catalogId` — products for that catalog
- `/catalog/food` — legacy; resolves Food store-type id

## UI mapping

| UI | Source |
| --- | --- |
| Catalog cards | `GET store-types` |
| Product list | `GET products?platformCategoryId=` |
| Category / Sub / Sub-sub | `GET categories?platformCategoryId=` tree |
| Badges chips | `GET store-types/:id/badges` |
| Add product | Upload images → `POST` + `platformCategoryId` + `imageUrl`/`imageUrls` |
| Edit product | `GET :id` hydrate → upload new files → `PATCH :id` |
| Image upload | `POST /vendor-panel/catalog/uploads/images` (`file`) |
