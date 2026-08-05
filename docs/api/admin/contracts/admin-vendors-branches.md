# Admin Vendors — Branches list + create

Confirmed from Postman **"POST Create branch"** (list shape from create response / GET nested resource).

## List branches

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/vendors/:vendorId/branches` |
| Feature | `vendors` |
| UI | Vendor detail → Branches tab; Edit vendor · Branches (step 2) |

### Success `data`

```json
{
  "count": 2,
  "branches": [ /* branch objects */ ]
}
```

## Create branch

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/vendors/:vendorId/branches` |
| Feature | `vendors` |
| UI | Branches → Add branch → Branch setup → Save |

### Body (confirmed)

```json
{
  "name": "Test Branch",
  "area": "Seef",
  "address": "Seef District",
  "phone": "+973 1700 0099",
  "latitude": 26.2285,
  "longitude": 50.535
}
```

### FE mapping

| Form | Sent |
| --- | --- |
| Branch name | `name` |
| Area / city | `area` |
| Address | `address` |
| Latitude / Longitude | numbers |
| Phone | omitted (not on form; optional in API) |
| Delivery / hours UI | skipped (not in create body) |

### Response

Same `{ count, branches[] }` — Branches tab refreshes after navigate back.
