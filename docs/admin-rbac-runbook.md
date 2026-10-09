# Admin RBAC — operations runbook (Phase 6)

## What is enforced

| Layer | Always on? | Rollback |
|-------|------------|----------|
| Module permissions (`LIVE_DASHBOARD.VIEW`, etc.) | **Yes** | Fix role/overrides in DB; no env kill switch |
| Zone/country **data scope** (orders, map, incidents, fleet) | Default **on** | `ADMIN_OPS_ZONE_SCOPE_ENABLED=false` on API |
| Portal route + sidebar guards | Deployed with portal build | Redeploy previous portal |

## Deploy checklist

1. Run automated tests:
   - `cd yjeek_backend && npm run test:admin-rbac`
   - `cd Yjeek-Vendor-and-admin-portal && npm run test:admin-rbac`
2. Deploy **backend** then **admin portal** (portal depends on `/me` permissions shape).
3. Post-deploy smoke:
   ```bash
   cd yjeek_backend
   npx tsx scripts/admin-rbac-smoke.ts
   ```
   Optional HTTP (Dispatcher JWT):
   ```bash
   ADMIN_RBAC_SMOKE_BASE_URL=https://api.example.com/api/v1 \
   ADMIN_RBAC_SMOKE_ACCESS_TOKEN=eyJ... \
   npx tsx scripts/admin-rbac-smoke.ts
   ```
4. Manual sign-off: [admin-rbac-qa-matrix.md](./admin-rbac-qa-matrix.md) (P1 Dispatcher + P0 Super Admin).

## Verify runtime flags

`GET /admin/auth/me` includes:

```json
"serverCapabilities": { "opsZoneScopeEnforced": true }
```

When `opsZoneScopeEnforced` is `false`, zone dispatchers may see country-wide operational data again — module 403s still apply.

## Emergency rollback (data scope only)

1. On API hosts, set `ADMIN_OPS_ZONE_SCOPE_ENABLED=false` (or `0` / `off`).
2. Restart API processes (PM2/systemd).
3. Confirm `/admin/auth/me` → `opsZoneScopeEnforced: false`.
4. Investigate root cause; re-enable when fixed (`true` or unset).

**Do not** disable module permission middleware — that would expose admin modules to wrong roles.

## 403 monitoring

Admin permission denials log one JSON line per 403 on `/admin/*` routes:

```json
{"event":"admin_access_denied","status":403,"code":"FORBIDDEN","message":"Missing permission: USERS_ROLES.VIEW",...}
```

**CloudWatch / PM2 logs — example filter**

- Event: `admin_access_denied`
- Spike on `Missing permission: LIVE_DASHBOARD.VIEW` → bad overrides or stale session; user should re-login after role fix.
- Same user hitting many modules → possible scraper or misconfigured integration.

## Common incidents

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Full sidebar but 403 on overview | Mock API + real dashboard feature flag | `VITE_ADMIN_USE_MOCK_API=false` or add `auth,dashboard` to real features |
| `LIVE_DASHBOARD: []` in overrides | Accidental save | Clear overrides API or role change + `{}` overrides |
| Dispatcher sees all Bahrain orders | Scope flag off or GLOBAL role | Check `opsZoneScopeEnforced`, user scope zones |
| 404 on order detail | Out of zone (expected) | Normal for zone dispatcher |

## Portal env (production)

```env
VITE_ADMIN_USE_MOCK_API=false
VITE_API_BASE_URL=https://<api>/api/v1
```

Hybrid mocks are for local dev only — not for production RBAC validation.
