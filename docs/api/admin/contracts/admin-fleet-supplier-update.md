# Admin Fleet — Update supplier

Confirmed from Postman **"PATCH Update supplier"** + `200` response.

## Update supplier

| Field | Value |
| --- | --- |
| Method | `PATCH` |
| Path | `/admin/fleet/suppliers/:supplierId` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.fleet.supplier` |
| Feature flag | `fleet` |
| UI | Detail **Edit** → `/admin/fleet/suppliers/:id/edit` (same form as Add supplier) |

### Confirmed Postman sample body

```json
{
  "contactPerson": "Ahmed Ali",
  "commissionPct": 12
}
```

Edit form also sends `name`, `type`, `phone`, `email`, `city` when filled (same keys as create) so the full UI can save.

### Success `data`

Same supplier object shape as create/detail list item (`id`, `name`, `displayCode`, `type`, …).

## App wiring

```
AdminSupplierDetailPage [Edit]
  → /admin/fleet/suppliers/:id/edit
AdminAddSupplierPage (edit mode)
  → GET detail to prefill
  → adminService.updateAdminFleetSupplier(id, form)
  → PATCH /admin/fleet/suppliers/:id
  → back to detail
```
