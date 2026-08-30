# SLA Three-Tier Thresholds — Implementation Plan

Full plan with backend status: see also `Yjeek_teck_backend/docs/sla-three-tier-thresholds-plan.md`

## Summary

Extend existing SLA models so each duration metric supports:

- **Target** (existing)
- **At Risk** (new)
- **Critical** (new)

Evaluated centrally and used by Live Dashboard buckets (`on_track` / `at_risk` / `critical`).

## Status

| Phase | Status |
|-------|--------|
| 1 Schema & tier utilities | Done |
| 2 Evaluation engine | Done |
| 3 Live Dashboard wiring | Done |
| 4 SLA monitor tier breaches | Done |
| 5 Incidents (`OpsIncident` auto-create) | Done |
| 6 Reset API (`POST /:id/reset`) | Done |
| 7 Admin UI (three-column tier grid) | Done |
| 8 QA & rollout | Done |

## Admin UI (Phase 7 — done)

- `AdminVendorSlaTemplate.jsx` — tier grid for Vendor hot food, Champ acceptance, Dispatcher assignment
- `mapAdminSlaModels.js` — `{ target, atRisk, critical }` mapping (legacy scalars auto-normalize)
- `AdminSlaModelsPage.jsx` — Reset calls `POST /admin/sla-models/:id/reset`
- `mockClient.js` — mock tier config + reset route

## Next: Incidents (Phase 5 — done)

- `sla-incident.service.ts` — idempotent `OpsIncident` upsert on AT_RISK / CRITICAL
- `sla-monitor.job.ts` — syncs incidents on breach; auto-resolves when SLA clears

## QA (Phase 8 — done)

- Checklist: `docs/ops/sla-three-tier-qa-checklist.md`
- Backend regression: 28 SLA-focused tests passing
- `vendor-sla-mode-configs.ts` updated for tier-aware vendor wizard inheritance
