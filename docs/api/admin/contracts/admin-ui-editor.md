# Admin UI Editor — page APIs

Confirmed from Postman **17. UI Editor** mapping table (2026-08-02).

## Feature flag

`ui-editor` in `VITE_ADMIN_REAL_API_FEATURES` (also on when `VITE_ADMIN_USE_MOCK_API=false`).

## Page chrome

| UI | API |
| --- | --- |
| Open UI Editor | `GET /admin/ui-editor/apps` |
| Customer / Champ toggle | Same list APIs with `?app=CUSTOMER` or `?app=CHAMP` |
| Preview | `GET /admin/ui-editor/preview?app=&screen=` |
| Publish (Banners / Screen map) | `POST /admin/ui-editor/publish` body `{ "app": "CUSTOMER" }` |
| Publish (Categories tab) | `POST /admin/ui-editor/home/categories/publish` |
| Publish (Exclusive offers tab) | `POST /admin/ui-editor/home/exclusive-offers/publish` |

## Tabs

| Tab | APIs |
| --- | --- |
| Screen map | `GET /admin/ui-editor/screen-map?app=` (Home includes **Super Exclusive offers** slot) |
| Banners & ads | Placements + preview + banners CRUD (see prior section) |
| Categories | See below |
| Exclusive offers | See below |

## Categories tab

Home categories configure the **customer app home grid only** (global `home_entries`, not scoped to Champ).

| UI | API |
| --- | --- |
| Load categories | `GET /admin/ui-editor/home/categories` → `categories` (live SM refs) + `unavailableCategories` |
| Add to home picker catalog | `GET /admin/ui-editor/home/catalog` |
| Home layout preview | `GET /admin/ui-editor/home` |
| Add to home | `POST /admin/ui-editor/home/categories` |
| Drag reorder | `PATCH /admin/ui-editor/home/categories/reorder` |
| Rename / hide (parent or nested sub-type row) | `PATCH /admin/ui-editor/home/categories/:categoryId` |
| Remove from home | `DELETE /admin/ui-editor/home/categories/:categoryId` |
| Repair duplicates / cascade | `POST /admin/ui-editor/home/categories/cleanup` |
| Publish home grid | `POST /admin/ui-editor/home/categories/publish` (header **Publish home grid** on Categories tab) |

### GET home/categories response

Top-level rows are home grid tiles (`parentId = null`). Two-level store types include nested `children[]` for sub-type presentation rows (not home tiles — shown when customer taps the parent category).

```json
{
  "categories": [
    {
      "id": "he-food",
      "kind": "STORE_TYPE",
      "refId": "st-food",
      "name": "Food",
      "iconUrl": "https://…/food.png",
      "sortOrder": 0,
      "isActive": true,
      "isHidden": false,
      "structure": "SINGLE",
      "kindMismatch": false,
      "refActive": true,
      "refPublishStatus": "PUBLISHED",
      "children": []
    },
    {
      "id": "he-services",
      "kind": "STORE_TYPE",
      "refId": "st-services",
      "name": "Services",
      "structure": "TWO_LEVEL",
      "children": [
        {
          "id": "he-salon",
          "kind": "SUB_TYPE",
          "refId": "sb-salon",
          "name": "Salon & Beauty",
          "sortOrder": 0,
          "isActive": true
        }
      ]
    }
  ]
}
```

Adding a two-level store type via POST cascades published sub-types into `children` automatically. Store Management sub-type changes re-sync child rows when the parent is on home.

### Create body (Add to home)

Rule 1: `kind` + `refId` required — no free-text entity creation.

```json
{
  "kind": "STORE_TYPE",
  "refId": "st-food",
  "name": "Food"
}
```

### Reorder body

```json
{
  "items": [{ "id": "{{categoryId}}", "sortOrder": 0, "isFeatured": true }]
}
```

### Patch body

```json
{ "name": "Food", "isFeatured": true, "sortOrder": 1, "isActive": true }
```

`isActive: false` = hidden in the UI.

## Exclusive offers tab

Curated **product carousel** on customer home (not banners). Same UX pattern as Categories: list editor + phone preview + dedicated publish.

| UI | API |
| --- | --- |
| Load section + products | `GET /admin/ui-editor/home/exclusive-offers` |
| Section title / visibility | `PATCH /admin/ui-editor/home/exclusive-offers` |
| Product picker | `GET /admin/ui-editor/home/exclusive-offers/products?search=&vendorId=&storeTypeId=&availableOnly=` |
| Add products | `POST /admin/ui-editor/home/exclusive-offers/items` body `{ "productIds": [] }` |
| Drag reorder | `PATCH /admin/ui-editor/home/exclusive-offers/items/reorder` |
| Edit price / visibility | `PATCH /admin/ui-editor/home/exclusive-offers/items/:itemId` |
| Remove from section | `DELETE /admin/ui-editor/home/exclusive-offers/items/:itemId` |
| Publish carousel | `POST /admin/ui-editor/home/exclusive-offers/publish` (header **Publish exclusive offers**) |

Also surfaced on **Screen map** and **Banners & ads → Home** as slot `home_exclusive_offers` (`+ Add` opens product picker, not banner modal).

Full contract: backend `docs/super-exclusive-offers-api.md`.

## CMS / pages (service ready; no dedicated tab UI yet)

| API | Method + path |
| --- | --- |
| Catalog (CMS) | `GET /admin/ui-editor/catalog` |
| List pages | `GET /admin/ui-editor/pages?status=all` |
| Ensure known pages | `POST /admin/ui-editor/pages/ensure` |
| Get help page | `GET /admin/ui-editor/pages/help` |
| Upsert help page | `PUT /admin/ui-editor/pages/help` |
| Publish / unpublish help | `POST .../pages/help/publish` · `.../unpublish` |

Service methods: `getCatalog`, `listPages`, `ensurePages`, `getHelpPage`, `upsertHelpPage`, `publishHelpPage`, `unpublishHelpPage`.

## Banners list (confirmed)

`GET /admin/ui-editor/banners?app=CUSTOMER&status=all`

```json
{
  "success": true,
  "data": {
    "count": 7,
    "banners": [
      {
        "id": "…",
        "title": "new offer",
        "name": "new offer",
        "subtitle": "Up to 30% off",
        "imageUrl": "http://…/uploads/banners/….png",
        "bannerType": "STATIC",
        "type": "Static",
        "placementKey": "home_top",
        "placement": "Home top - scroll banner",
        "displayType": "Scroll",
        "status": "Expired",
        "statusKey": "expired",
        "schedule": "22 Mar 2026 – 31 Mar 2026",
        "isActive": true
      }
    ]
  }
}
```

Mapped UI columns: image (`imageUrl`), name (`title`/`name`), schedule, type (`bannerType`), placement, status.

## Screen map (confirmed)

`GET /admin/ui-editor/screen-map?app=CUSTOMER`

```json
{
  "success": true,
  "data": {
    "app": "CUSTOMER",
    "apps": [{ "key": "CUSTOMER", "label": "Customer app" }],
    "screens": [
      {
        "key": "home",
        "label": "Home Screen",
        "shortLabel": "Home",
        "slotCount": 3,
        "bannerTotal": 6,
        "slots": [
          {
            "key": "home_top",
            "label": "Home top - scroll banner",
            "displayType": "Scroll",
            "bannerType": "SCROLL",
            "bannerCount": 5,
            "activeCount": 0,
            "banners": [{ "id": "…", "title": "…", "bannerType": "STATIC", "isActive": false }]
          }
        ]
      }
    ]
  }
}
```

UI: Screen map tab lists `screens[]` with slot labels, `bannerCount`, and `displayType`. Add uses slot `key` as `placementKey`.

## Banner images (display)

Backend `/uploads/...` responses use `Cross-Origin-Resource-Policy: same-origin`, so the SPA cannot `<img>` them from another origin.

- Dev: Vite proxies `/uploads` → API host (from `VITE_API_BASE_URL` without `/api/v1`)
- UI rewrites `http://host:3000/uploads/...` → `/uploads/...` for display only
- Create/update still sends the original `imageUrl` from the upload/list API

## Banners & ads — image upload

| Step | API / behavior |
| --- | --- |
| Pick file | Local file picker (JPEG / PNG / WebP, max 5 MB) |
| Upload | `POST /admin/uploads/images` multipart field `file` → `data.url` |
| Create / update banner | Include `imageUrl` from upload (keep existing URL on edit if no new file) |

See `docs/api/admin/contracts/admin-uploads-images.md`.

## Banners quick flow

Open Banners → Placements + Preview + List banners → Add = Create banner → Publish = Publish UI.
