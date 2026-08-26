# Admin Vendors — Staff list + create

Confirmed from Postman **"List staff (incl. owner)"** and **"POST Create staff"**.

## List staff

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/vendors/:vendorId/staff` |
| Feature | `vendors` |
| UI | Vendor detail → Users & staff |

### Success `data` (confirmed)

```json
{
  "count": 7,
  "users": [
    {
      "id": "…",
      "userId": "…",
      "displayName": "Branch Manager",
      "email": "manager.test@yjeek.com",
      "phone": "+973 33008888",
      "role": "BRANCH_MANAGER",
      "roleRaw": "BRANCH_MANAGER",
      "isOwner": false,
      "branch": { "id": "…", "name": "Bangkok Wok — Main", "area": "Seef" },
      "branchLabel": "Bangkok Wok — Main",
      "lastActive": "2026-07-28T22:58:35.685Z",
      "status": "ACTIVE",
      "permissions": {}
    }
  ]
}
```

### UI mapping

| API | Users & staff table |
| --- | --- |
| `displayName` + `email` | User |
| `role` | Role badge (`VENDOR_ADMIN` → Vendor admin, `BRANCH_MANAGER` → Branch manager, `STAFF` → Staff) |
| `branchLabel` (or `branch.name`) | Branch — `null` branch + `"All branches"` for vendor admins |
| `lastActive` | Relative time |
| `status` | `ACTIVE` → Active |

`roleRaw` / `permissions` / `isOwner` are kept on the row for later edit; not shown as extra columns.

## Create staff

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/vendors/:vendorId/staff` |
| Feature | `vendors` |
| UI | Users & staff → Add user → Create user |

### Body (confirmed)

```json
{
  "displayName": "Branch Manager",
  "email": "manager.test@yjeek.com",
  "phone": "33008888",
  "countryCode": "+973",
  "password": "StaffPass@123",
  "role": "BRANCH_MANAGER",
  "vendorLocationId": "{{branchId}}"
}
```

### Role enum

`VENDOR_ADMIN` | `BRANCH_MANAGER` | `STAFF` | `GROUP_ADMIN` | `OPERATOR`

UI maps: Vendor admin → `VENDOR_ADMIN`, Branch manager → `BRANCH_MANAGER`, Staff → `STAFF`.

`BRANCH_MANAGER` / `STAFF` require `vendorLocationId`. `VENDOR_ADMIN` may omit branch.

### Skipped UI fields on create

- **Status** — not in POST body (defaults Active)

### Permissions (create / update)

Send optional `permissions` object. Keys map to vendor-panel route guards:

| UI toggle | API key | Guards |
| --- | --- | --- |
| Orders | `orders` | Orders, dashboard, notifications |
| Catalog / menu | `catalog` | Catalog products/categories |
| Working hours | `workingHours` | Open/close, opening hours |
| Staff | `staff` | Staff management |
| Delivery settings | `deliverySettings` | Radius / ETA / min order |
| Promotions | `promotions` | Promotions |

Example:

```json
{
  "permissions": {
    "orders": true,
    "catalog": false,
    "workingHours": true,
    "staff": false,
    "deliverySettings": false,
    "promotions": false
  }
}
```

Stored flags are enforced for Branch manager, Staff, and Vendor admin staff. Vendor **owner** always has full access (`permissions: { all: true }`).
