# Admin Store types — Create

Confirmed from Postman **11. Store types → Create** and live `POST /admin/store-types` response (201).

## Create store type

| Field | Value |
| --- | --- |
| Method | `POST` |
| Relative path | `/admin/store-types` |
| Full URL | `{VITE_API_BASE_URL}/admin/store-types` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.storeTypes.list` |
| Feature flag | `store-types` or `VITE_ADMIN_USE_MOCK_API=false` |
| UI | Admin → Create store type (`/admin/stores/new`) |

### Request body (confirmed sample)

```json
{
  "name": "Food",
  "slug": "food2",
  "iconUrl": "https://cdn.yjeek.com/store-types/food.png",
  "iconEmoji": "🍔",
  "sortOrder": 5,
  "isActive": false,
  "onDemandDelivery": true,
  "pickup": true,
  "dineIn": true,
  "scheduled": false,
  "services": false,
  "publishStatus": "DRAFT"
}
```

### Frontend mapping

| UI | Body field |
| --- | --- |
| Display name | `name` |
| Internal key | `slug` |
| Home order position | `sortOrder` |
| Visible in customer app | `isActive` |
| Icon emoji | `iconEmoji` (when set) |
| Icon URL | `iconUrl` (when set) |
| On-Demand Delivery | `onDemandDelivery` |
| Pickup | `pickup` |
| Dine-in | `dineIn` |
| Scheduled | `scheduled` |
| Services | `services` |
| Save draft | `publishStatus: "DRAFT"` |
| Publish | `publishStatus: "PUBLISHED"` |

Not in confirmed Create body: menu categories, badges (UI chrome only until those APIs are wired).

### Success (HTTP 201)

Returns created store type (`id`, `slug`, `orderModes` as label array, `publishStatus`, etc.).

### Files

| Role | Path |
| --- | --- |
| Mapper | `mapAdminCreateStoreTypeRequest` |
| Service | `adminStoreTypeService.createStoreType` |
| Page | `AdminCreateStoreTypePage.jsx` (`/admin/stores/new`) |
