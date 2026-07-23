# Vendor Branches API contract

Confirmed from Postman screenshots. Real IDs, phones, and addresses are redacted.

## List branches

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/branches` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.branches` |

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {
    "count": 7,
    "branches": [
      {
        "id": "<redacted>",
        "name": "<redacted>",
        "address": "<redacted>",
        "area": "<redacted>",
        "city": "<redacted>",
        "phone": "<redacted>",
        "radiusKm": 5,
        "minOrderAmount": 3,
        "etaMin": 30,
        "status": "OPEN",
        "operationalStatus": "OPEN",
        "isSuspended": false,
        "suspensionReason": null,
        "openingHours": null,
        "isPrimary": true
      }
    ]
  }
}
```

## Get branch

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/vendor-panel/branches/:branchId` |
| Auth | Protected — Bearer via `apiClient` |

Returns a single branch object in `data` (same fields as a list item).

## Update branch

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Relative path | `/vendor-panel/branches/:branchId` |
| Auth | Protected — Bearer via `apiClient` |

### Confirmed request body

```json
{
  "phone": "<string>",
  "etaMin": 28
}
```

The edit form also saves `name`, `address`, `radiusKm`, and `minOrderAmount` (present on the branch model). `openingHours` stays local-only (null / format unconfirmed).

### Success (HTTP 200)

Returns the updated branch object in `data`.

## Set branch status

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Relative path | `/vendor-panel/branches/:branchId/status` |
| Auth | Protected — Bearer via `apiClient` |
| Postman | `Set status OPEN` (and equivalent Busy/Closed) |

### Request body

```json
{
  "status": "OPEN"
}
```

Confirmed API enum values used by the Branches card buttons and Topbar Open/Close rows:

| UI button | API `status` |
| --- | --- |
| Open | `OPEN` |
| Busy | `BUSY` |
| Closed | `CLOSED` |

### Success (HTTP 200)

Returns the updated branch object in `data`, including `status` and `operationalStatus` (e.g. `"OPEN"`).

Suspended branches cannot self-change status in the UI (no status buttons / Topbar shows Suspended).

## Close all branches

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Relative path | `/vendor-panel/branches/close-all` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.branchesCloseAll` |
| UI | Topbar → **Close all branches** |

### Request body

Empty object `{}` (no confirmed body fields).

### Success (HTTP 200)

Same list shape as List branches — `data.count` + `data.branches[]`, with branch `status` / `operationalStatus` set to `"CLOSED"`.

## Open all branches

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Relative path | `/vendor-panel/branches/open-all` |
| Auth | Protected — Bearer via `apiClient` |
| Registry | `endpoints.vendor.branchesOpenAll` |
| UI | Topbar → **Open all branches** |

### Request body

Empty object `{}` (no confirmed body fields).

### Success (HTTP 200)

Same list shape as List branches — `data.count` + `data.branches[]`, with branch `status` / `operationalStatus` set to `"OPEN"`.

## Frontend mapping

| UI field | Source |
| --- | --- |
| `name` | `name` |
| `address` | `address` |
| `phone` | `phone` |
| `radius` | `` `${radiusKm} km` `` |
| `eta` | `` `${etaMin} min` `` |
| `minOrder` | formatted `minOrderAmount` |
| `status` | Suspended if `isSuspended`, else OPEN/BUSY/CLOSED → Open/Busy/Closed |

## Unconfirmed

- Create branch
- Delete branch
- `openingHours` structure

## Modes

| Flag | Behavior |
| --- | --- |
| `VITE_VENDOR_USE_MOCK_API=true` | Mock branches + status + close-all + open-all |
| `VITE_VENDOR_USE_MOCK_API=false` | Real list/get/update/set-status/close-all/open-all |
| Admin | Untouched |
