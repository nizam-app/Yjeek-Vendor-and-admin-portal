# Admin Store types — Get (edit detail)

Confirmed from Postman **11. Store types → Get** and live `GET /admin/store-types/{{storeTypeId}}` response (2026-08-01).

## Get store type

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/store-types/{{storeTypeId}}` |
| Full URL | `{VITE_API_BASE_URL}/admin/store-types/{storeTypeId}` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.storeTypes.detail(storeTypeId)` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `store-types` |
| UI | Admin → Store type edit (`/admin/stores/:storeTypeId`) |

### Path params

| Param | Notes |
| --- | --- |
| `storeTypeId` | CUID from list row / Edit action |

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "id": "cmreb3sxs0007v9b8bffnnf5c",
    "name": "Gifts",
    "slug": "gifts",
    "iconEmoji": "🎁",
    "iconUrl": null,
    "sortOrder": 8,
    "visible": true,
    "isActive": true,
    "publishStatus": "PUBLISHED",
    "orderModes": {
      "onDemandDelivery": false,
      "pickup": false,
      "dineIn": false,
      "scheduled": true,
      "services": false
    },
    "orderModeLabels": ["Scheduled Delivery"],
    "menuCategories": [],
    "badges": [],
    "categoryCount": 0,
    "vendorCount": 1,
    "createdAt": "2026-07-10T02:18:32.896Z",
    "updatedAt": "2026-08-01T02:36:55.991Z"
  }
}
```

### Frontend mapping

| UI field | Source |
| --- | --- |
| Display name | `name` |
| Internal key | `slug` |
| Home order position | `sortOrder` |
| Visible in customer app | `visible` |
| Icon | `iconUrl` → catalog by `slug` → `iconEmoji` |
| Order mode toggles | `orderModes.onDemandDelivery` / `pickup` / `dineIn` / `scheduled` / `services` |
| Menu categories | `menuCategories[]` (empty → empty list; no mock padding) |
| Item badges | `badges[]` (empty → empty list; no mock padding) |

### Files

| Role | Path |
| --- | --- |
| Mapper | `mapAdminStoreTypeDetail` in `src/mappers/admin/mapAdminStoreTypes.js` |
| Service | `adminStoreTypeService.getStoreType` |
| Page | `AdminCreateStoreTypePage.jsx` |

### Not wired yet

Publish / Save draft / Update / menu-category & badge mutations — UI chrome only until those Postman bodies are confirmed.
