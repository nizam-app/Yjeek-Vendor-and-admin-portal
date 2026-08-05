# Admin Vendors — Delete branch

Confirmed from Postman **"DEL Delete branch"**.

## Delete branch

| Field | Value |
| --- | --- |
| Method | `DELETE` |
| Path | `/admin/vendors/:vendorId/branches/:branchId` |
| Body | none |
| Feature | `vendors` |
| UI | Branch setup → Delete branch → type branch name → confirm |

### Success

```json
{ "success": true, "data": { "count": 4, "branches": [/* remaining */] } }
```

Same list envelope as list/create/update. FE navigates back to vendor Branches tab after success.
