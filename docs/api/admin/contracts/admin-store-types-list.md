# Admin Store types — List (table rows)

Confirmed from Postman **11. Store types → List** and live `GET /admin/store-types` response (2026-08-01).

KPIs for the management page come from **`GET /admin/store-types/summary`** (`admin-store-types-summary.md`), loaded in parallel with this list.

## List store types

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/store-types` |
| Full URL | `{VITE_API_BASE_URL}/admin/store-types` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.storeTypes.list` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `store-types` |
| UI | Admin → Store Management table (`/admin/stores`) |

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "totalStoreTypes": 15,
    "visibleCount": 14,
    "hiddenCount": 1,
    "totalVendors": 39,
    "storeTypes": [
      {
        "id": "<cuid>",
        "name": "Groceries",
        "slug": "grocery",
        "icon": "🛒",
        "iconEmoji": "🛒",
        "iconUrl": null,
        "orderModes": ["Scheduled Delivery"],
        "categoryCount": 0,
        "vendorCount": 1,
        "visible": true,
        "isActive": true,
        "sortOrder": 1,
        "publishStatus": "PUBLISHED",
        "createdAt": "2026-07-15T22:41:19.556Z",
        "updatedAt": "2026-08-01T02:36:55.321Z"
      }
    ]
  }
}
```

List may also include summary counts; the page prefers the dedicated summary endpoint when both succeed.

### Frontend mapping

| UI | Source |
| --- | --- |
| Row key / Edit route | `id` (cuid) |
| Store type name | `name` |
| Slug (secondary line) | `slug` |
| Icon | `iconUrl` → catalog by `slug` → `iconEmoji` / `icon` |
| Order modes | `orderModes[]` joined with ` · ` |
| Categories | `categoryCount` |
| Vendors | `vendorCount` |
| Visible badge | `visible` |
| Row order | `sortOrder` ascending |

### Files

| Role | Path |
| --- | --- |
| Mapper | `mapAdminStoreTypesListPage` |
| Service | `adminStoreTypeService.listForPage` |
| Page | `AdminStoresPage.jsx` |
