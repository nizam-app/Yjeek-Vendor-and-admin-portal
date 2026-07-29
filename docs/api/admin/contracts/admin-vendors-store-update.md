# Admin Vendors — Update store info

Confirmed from Postman **"PATCH Update vendor (store info)"** + live probe.

## Update vendor

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Path | `/admin/vendors/:vendorId` |
| Feature | `vendors` |
| UI | Edit vendor · Store info → Save draft / Continue |

### Confirmed Postman sample body

```json
{
  "area": "Manama",
  "logoUrl": "https://cdn.yjeek.com/logos/gk.png",
  "coverUrl": "https://cdn.yjeek.com/covers/gk.jpg",
  "cuisineTags": ["healthy", "salads"],
  "storeTypeId": "{{storeTypeId}}"
}
```

### Also accepted (live)

`name`, `legalName`, `description`

### Load helpers

- `GET /admin/vendors/:vendorId` — prefills Store profile
- `GET /admin/store-types` — Store type dropdown (`storeTypeId`)

### UI gaps still skipped

- **Sub-category** (`storeProfile.category`) — not in PATCH body
- **File upload** — UI sets `logoUrl` / `coverUrl` via URL prompt (no upload API yet)
