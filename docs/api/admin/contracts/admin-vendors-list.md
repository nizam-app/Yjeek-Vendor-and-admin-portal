# Admin Vendors — List vendors (KPIs + filters)

Confirmed from Postman "List vendors (KPIs + filters)". Real IDs and names may be redacted in docs.

## List vendors

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/vendors` |
| Full URL | `{VITE_API_BASE_URL}/admin/vendors` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.vendors.list` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `vendors` |
| UI | Admin → Vendor Management |

### Query

| Param | Example | Notes |
| --- | --- | --- |
| `search` | `""` | Vendor name / code search |
| `status` | `all` | `all` · `active` · `pending` · `suspended` |
| `category` | `""` | Category filter |
| `limit` | `20` | Page size |

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "page": 1,
    "limit": 20,
    "total": 37,
    "kpis": {
      "totalVendors": 37,
      "active": 36,
      "pendingApproval": 0,
      "suspended": 0
    },
    "vendors": [
      {
        "id": "<cuid>",
        "name": "Bangkok Wok",
        "displayCode": "VND-GSTQ",
        "category": "Food & Beverage",
        "rating": 4.6,
        "branchCount": 1,
        "status": "Active",
        "accountStatus": "ACTIVE",
        "isActive": true,
        "isOnline": true,
        "storeTypeId": null,
        "orders": 0,
        "users": 0,
        "area": "Seef",
        "city": "Manama",
        "logoUrl": "<url>"
      }
    ]
  }
}
```

### Frontend mapping

| UI | Source |
| --- | --- |
| KPI Total vendors | `kpis.totalVendors` |
| KPI Active | `kpis.active` |
| KPI Pending approval | `kpis.pendingApproval` |
| KPI Suspended | `kpis.suspended` |
| Vendor name | `name` |
| Vendor ID (display) | `displayCode` |
| Row key / detail route | `id` (cuid) |
| Category | `category` |
| Orders | `orders` |
| Branches | `branchCount` |
| Users | `users` |
| Rating | `rating` |
| Status badge | `status` |

### App wiring

```
AdminVendorsPage
  → adminVendorService.listVendors
  → mapAdminVendorsListResponse
  → apiClient (scope: admin, feature: vendors)
```

## Modes

| Flag | Behavior |
| --- | --- |
| `VITE_ADMIN_REAL_API_FEATURES=vendors` | Real list API |
| Feature off | Falls back to mock `/admin/management?type=vendors` |

## Unconfirmed

- Vendor detail GET by id
- Create / update / delete vendor mutations
- Exact `status=pending` enum alias if backend differs
