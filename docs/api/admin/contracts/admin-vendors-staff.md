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
- **Permissions** toggles — not in POST body (`permissions: {}` in response)
