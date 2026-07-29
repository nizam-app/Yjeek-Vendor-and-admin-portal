# Admin Vendors — Get vendor (detail Overview)

Confirmed from Postman **"Get vendor"**.

## Get vendor

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/vendors/:vendorId` |
| Full URL | `{VITE_API_BASE_URL}/admin/vendors/{vendorId}` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.vendors.detail` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `vendors` |
| UI | Admin → Vendor Management → Vendor detail → **Overview** |

### Path

| Param | Example | Notes |
| --- | --- | --- |
| `vendorId` | `cmrwlsox8001m8nxczkfxgstq` | Backend cuid from list row `id` |

### Success (HTTP 200)

Maps to detail header, KPI cards, Store profile, and Status & controls.

Nested tabs (**Branches**, **Users & staff**, **Delivery zones**, **Promotions**, **Commission & fees**, **SLA**) are **not** in this payload — wire separate list/get APIs for those.

```json
{
  "success": true,
  "data": {
    "id": "cmrwlsox8001m8nxczkfxgstq",
    "name": "Bangkok Wok",
    "displayCode": "VND-GSTQ",
    "category": "Food & Beverage",
    "rating": 4.6,
    "branchCount": 1,
    "status": "Active",
    "accountStatus": "ACTIVE",
    "isActive": true,
    "isOnline": true,
    "legalName": null,
    "description": "Thai curries and street noodles",
    "logoUrl": "https://…",
    "coverUrl": "https://…",
    "area": "Seef",
    "city": "Manama",
    "dispatchMode": "AUTO",
    "forceClosed": false,
    "storeProfile": {
      "legalName": null,
      "category": "Hot food",
      "delivery": { "radiusKm": 0, "etaMin": 30, "minOrder": 1 }
    },
    "kpis": {
      "orders30d": 0,
      "gmv30d": 0,
      "avgRating": 4.6,
      "activeBranches": "1 / 1",
      "openIssues": 0
    },
    "controls": {
      "isOnline": true,
      "dispatchMode": "AUTO",
      "visibleAndAccepting": true
    },
    "deliveryDefaults": { }
  }
}
```

### UI mapping (Overview)

| UI | API |
| --- | --- |
| Title / initials | `name` |
| Status badge | `status` |
| Subtitle ID | `displayCode` |
| Subtitle type | `category` |
| Branches label | `branchCount` |
| Rating | `rating` |
| Orders / GMV / Avg / Active branches / Open issues | `kpis.*` |
| Legal name | `storeProfile.legalName` \|\| `legalName` |
| Category (profile) | `storeProfile.category` |
| Delivery line | `storeProfile.delivery` |
| Store online | `controls.isOnline` |
| Online hint | `controls.visibleAndAccepting` |
| Dispatch mode | `controls.dispatchMode` (`AUTO` → Auto-dispatch) |

### Not wired from this response

Force close / Suspend buttons need `POST .../force-close` and `POST .../suspend`.  
Online toggle needs `PATCH .../controls`.
