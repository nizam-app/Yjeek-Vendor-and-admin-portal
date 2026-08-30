# SLA Three-Tier Thresholds — QA Checklist

Full checklist with backend verification steps: `Yjeek_teck_backend/docs/sla-three-tier-qa-checklist.md`

## Quick manual smoke test

1. **SLA Models → Champ SLA** — confirm three-column grid (Target / At-risk / Critical).
2. Change hot food at-risk to `00:04:00`, critical to `00:06:00` → **Save SLA**.
3. Reload page — values must persist.
4. **Reset** — restores platform defaults.
5. **Live Dashboard** — order past at-risk should show At Risk; past critical or with open incident → Critical.

## Automated regression (backend)

```bash
cd Yjeek_teck_backend
npx tsx --test tests/sla-tier.test.ts tests/sla-config.test.ts tests/sla-evaluation.test.ts tests/sla-incident.test.ts tests/vendor-sla-inheritance.test.ts tests/champ-offer-ttl.test.ts
```

All tests should pass before production rollout.
