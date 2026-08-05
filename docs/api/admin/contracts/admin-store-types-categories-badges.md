# Admin Store types — Menu categories & badges

Confirmed from Postman **11. Store types** (Add / Update / Delete menu category & badge).

## Menu categories

| Action | Method | Path | Body |
| --- | --- | --- | --- |
| Add | `POST` | `/admin/store-types/{{storeTypeId}}/menu-categories` | `{ "name", "sortOrder" }` (+ `parentId` when nesting) |
| Update | `PATCH` | `/admin/store-types/{{storeTypeId}}/menu-categories/{{menuCategoryId}}` | `{ "name", "isVisible" }` |
| Delete | `DELETE` | `/admin/store-types/{{storeTypeId}}/menu-categories/{{menuCategoryId}}` | — |

### Add success (201)

```json
{
  "success": true,
  "data": {
    "id": "<cuid>",
    "storeTypeId": "<cuid>",
    "parentId": null,
    "name": "Mains",
    "isVisible": true,
    "sortOrder": 1,
    "itemCount": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## Badges

| Action | Method | Path | Body |
| --- | --- | --- | --- |
| Add | `POST` | `/admin/store-types/{{storeTypeId}}/badges` | `{ "label", "icon", "color", "sortOrder" }` |
| Update | `PATCH` | `/admin/store-types/{{storeTypeId}}/badges/{{badgeId}}` | `{ "label", "color", "sortOrder" }` |
| Delete | `DELETE` | `/admin/store-types/{{storeTypeId}}/badges/{{badgeId}}` | — |

## UI

Wired on **edit** store type (`/admin/stores/:storeTypeId`) only — needs an existing `storeTypeId`.

| UI action | API |
| --- | --- |
| Add category | POST menu-categories |
| Add sub-category | POST with `parentId` |
| Visible toggle / Edit name | PATCH menu-category |
| Delete category | DELETE menu-category |
| Add badge | POST badges |
| Edit badge label | PATCH badge |
| Remove badge | DELETE badge |

Create store type keeps empty categories/badges until the type exists (save first, then edit).

## Files

- `endpoints.admin.storeTypes.menuCategories|menuCategory|badges|badge`
- `mapAdminAddMenuCategoryRequest`, `mapAdminUpdateMenuCategoryRequest`, `mapAdminAddBadgeRequest`, `mapAdminUpdateBadgeRequest`
- `adminStoreTypeService.addMenuCategory|updateMenuCategory|deleteMenuCategory|addBadge|updateBadge|deleteBadge`
- `AdminCreateStoreTypePage.jsx`
