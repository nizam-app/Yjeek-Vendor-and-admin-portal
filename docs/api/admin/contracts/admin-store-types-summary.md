# Admin Store types — Summary (KPIs)

Confirmed from Postman **11. Store types → Summary** and live `GET /admin/store-types/summary` response (2026-08-01).

## Summary

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/store-types/summary` |
| Full URL | `{VITE_API_BASE_URL}/admin/store-types/summary` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.storeTypes.summary` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `store-types` |
| UI | Admin → Store Management KPI cards (`/admin/stores`) |

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "totalStoreTypes": 15,
    "visibleCount": 14,
    "hiddenCount": 1,
    "totalVendors": 39
  }
}
```

### Frontend mapping

| UI | Source |
| --- | --- |
| Store types | `totalStoreTypes` |
| Visible in app | `visibleCount` |
| Hidden | `hiddenCount` |
| Total vendors | `totalVendors` |

Loaded in parallel with `GET /admin/store-types` (list) by `adminStoreTypeService.listForPage`.
