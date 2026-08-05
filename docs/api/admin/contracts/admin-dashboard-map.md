# Admin Dashboard — Live map

Confirmed from Postman screenshots. Real credentials, tokens, and record IDs are redacted.

## Map

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/dashboard/map` |
| Full URL | `{VITE_API_BASE_URL}/admin/dashboard/map?layer=<layer>&region=BH` |
| Auth | Bearer Admin access token via shared `apiClient` |
| Registry | `endpoints.admin.dashboard.map` |
| Feature flag | `VITE_ADMIN_REAL_API_FEATURES` must include `dashboard` |
| UI | `/admin/dashboard` — Live map panel |

### Query parameters

| Name | Confirmed values | Notes |
| --- | --- | --- |
| `layer` | `champs`, `orders`, `vendors` | All three response shapes confirmed |
| `region` | `BH` | Same region code as overview |

### Success — `layer=champs` (HTTP 200)

```json
{
  "success": true,
  "data": {
    "layer": "champs",
    "legend": [
      { "key": "idle", "label": "Idle / light", "color": "green" },
      { "key": "busy", "label": "Busy 3-4", "color": "orange" },
      { "key": "overloaded", "label": "Overloaded", "color": "red" }
    ],
    "points": [
      {
        "id": "<redacted>",
        "name": "<redacted>",
        "status": "OFFLINE",
        "load": 3,
        "loadKey": "busy",
        "lat": 26.22,
        "lng": 50.58
      }
    ]
  }
}
```

### Success — `layer=orders` (HTTP 200)

No `legend` in the confirmed sample. Points use nested coordinates:

```json
{
  "success": true,
  "data": {
    "layer": "orders",
    "points": [
      {
        "id": "<redacted>",
        "orderNumber": "YJK-…",
        "status": "PREPARING",
        "vendorName": "<redacted>",
        "pickup": { "lat": 26.2167, "lng": 50.5833 },
        "dropoff": { "lat": 26.211, "lng": 50.601 }
      }
    ]
  }
}
```

`dropoff.lat` / `dropoff.lng` may be `null` — those dropoff markers are skipped.

Frontend expands each order into pickup and/or dropoff markers and shows a UI-only Pickup / Dropoff legend.

### Success — `layer=vendors` (HTTP 200)

```json
{
  "success": true,
  "data": {
    "layer": "vendors",
    "legend": [
      { "key": "open", "label": "Vendor open", "color": "blue" }
    ],
    "points": [
      {
        "id": "<redacted>",
        "name": "<redacted>",
        "area": "Adliya",
        "open": true,
        "lat": 26.2167,
        "lng": 50.5833
      }
    ]
  }
}
```

Closed vendors (`open: false`) render gray; open vendors use the legend blue.

### Zones / Heatmap tabs

Present in the existing UI. **No confirmed map API** — empty state only.

## Frontend mapping

`src/mappers/admin/mapAdminDashboardMap.js`

| Layer | Marker source | Color |
| --- | --- | --- |
| `champs` | `points[].lat/lng` | `legend` via `loadKey` |
| `orders` | `pickup` + `dropoff` (when coords present) | Pickup green / Dropoff orange |
| `vendors` | `points[].lat/lng` | `open` → blue; closed → gray |

## Architecture

```
AdminDashboardPage
  → useAdminDashboardMap
    → adminDashboardService.getMap
      → apiClient.get(endpoints.admin.dashboard.map, { feature: 'dashboard' })
      → mapAdminDashboardMapResponse
  → AdminLiveMap (Google Maps via VITE_GOOGLE_MAPS_API_KEY)
```

Markers use confirmed `lat` / `lng` on a Google Maps basemap. Legend colors unchanged.

## Unconfirmed (do not invent)

- Zones / Heatmap endpoints
- Error response bodies