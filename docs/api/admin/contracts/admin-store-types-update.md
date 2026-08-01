# Admin Store types — Update (edit)

Confirmed from Postman **11. Store types → Update** (`PATCH /admin/store-types/{{storeTypeId}}`).

## Update store type

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Relative path | `/admin/store-types/{{storeTypeId}}` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.storeTypes.detail(storeTypeId)` |
| UI | Edit store type — **Save draft** / **Publish** |

### Request body (confirmed sample)

```json
{
  "name": "Food2",
  "iconUrl": "https://cdn.yjeek.com/store-types/food-v2.png",
  "sortOrder": 5,
  "onDemandDelivery": true,
  "pickup": true,
  "dineIn": true
}
```

Frontend also sends `scheduled`, `services`, and `iconEmoji` when set (UI order-mode + Change icon).

### Mapping

| UI | Body |
| --- | --- |
| Display name | `name` |
| Home order position | `sortOrder` |
| Icon URL | `iconUrl` (when set) |
| Icon emoji | `iconEmoji` (when set) |
| On-Demand Delivery | `onDemandDelivery` |
| Pickup | `pickup` |
| Dine-in | `dineIn` |
| Scheduled | `scheduled` |
| Services | `services` |

### Success (200)

Returns updated store type (`publishStatus` often `"DRAFT"` until Publish endpoint is wired).

### Files

- `mapAdminUpdateStoreTypeRequest`
- `adminStoreTypeService.updateStoreType`
- `AdminCreateStoreTypePage.jsx` (`handleSave` in edit mode)
