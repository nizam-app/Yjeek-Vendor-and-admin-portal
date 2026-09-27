# Automation tab — kivabe kaj kore (How it works)

Admin Panel → **Automation** live backend er sathe kivabe wire kora hoyeche — ei document e summary.

**Repos:** Mock/demo data use hoy na jokhon `automation` feature flag on thake. Tarpor tab-gulo real API theke data ney; engine er config **DispatchRuleSet** (plus Fleet / Settings / SLA jekhane lagbe) theke ashe.

Related backend docs:

- `Yjeek_teck_backend/docs/dispatch-automation-admin-fe-contract.md`
- `Yjeek_teck_backend/docs/dispatch-automation-work-record.md`
- `Yjeek_teck_backend/docs/dispatch-automation-gap-matrix.md`

---

## 1. Enable korte hole (env)

Admin portal `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_ADMIN_USE_MOCK_API=false
VITE_ADMIN_REAL_API_FEATURES=...,automation
```

- Feature key: `automation` (`src/services/admin/dispatchAutomationFeature.js`)
- `isAutomationRealApi()` true na hole Automation screens mock/empty path e thake
- Change er pore Vite dev server restart korte hoy

Backend auth: Admin JWT + RBAC (`SLA_MODELS` rules/config; Fleet permission POD er jonno).

---

## 2. Architecture (ek line e)

| Concept | Role |
|--------|------|
| **DispatchRuleSet** | Versioned JSON config — scoring weights, stacking, radius stages, vehicle matrix, vendor-accept gates |
| **dispatch-automation/**\* | Read-only “effective” DTOs (overview, log, champ-scoring CPI, champ-status, scheduled-tiers) |
| **Fleet + SystemConfig** | Pay on Delivery (per-champ POD + platform float defaults) |
| **Vendors page** | Vendor Open/Busy/Closed + `openingHours` — Automation e sudhu reference |

Design principle: mockup er alada “databases” na — **ekta rule set** er sections + onno existing modules.

```
Admin UI (Automation tabs)
        │
        ├─ useDispatchRuleSet ──► GET overview (active id)
        │                      └─► GET/PATCH/activate /dispatch-rules/:id
        │
        ├─ useChampScoringEffective ──► GET /dispatch-automation/champ-scoring
        ├─ champ-status / scheduled-tiers ──► GET /dispatch-automation/...
        ├─ POD ──► Settings + Fleet champs (not rule set)
        └─ Vendor Status ──► static catalog (ops owns Vendors page)
```

---

## 3. Tabs — kothay data, ki editable

Nav: `AutomationTabNav.jsx` → `/admin/automation/...`

| Tab | Data source | Editable? | Save behaviour |
|-----|-------------|-----------|----------------|
| **Dispatch Rules** | `DispatchRuleSet` draft | Yes | PATCH draft → Activate publishes |
| **Champ Scoring** | Weights = rule set `config.scoring`; CPI table = `GET .../champ-scoring` (Champ SLA) | Weights yes; CPI read-only | Save = draft patch; Simulate = shadow run |
| **Stacking** | `config.stacking` + vehicle matrix | Yes | Draft patch + activate; live stacking needs Maps + rollout flags |
| **Radius Expansion** | `config.radius` (+ offer TTLs from Champ SLA) | Stage km + delay | Save Changes = draft; Save Automation = activate |
| **Vendor Status** | Static UI catalog | No (reference) | Buttons disabled; real status = Vendors Admin |
| **Pay on Delivery** | `SystemConfig.platformSettings.pod` + Fleet champs | Yes | Settings PATCH + champ `podEnabled` / max float / reconcile |
| **Scheduled Tiers** | `GET .../scheduled-tiers` (Vendor SLA effective) | Mostly display / SLA-linked | Policy from SLA models |
| **Champ Status** | `GET .../champ-status` + catalog merge | Caps/clocks where API allows | Live engine labels (AVAILABLE / ON_ORDER / …) |
| **Audit Log** | `GET .../log` | Read-only | Acceptance, rule changes, evaluations, attempts |

---

## 4. Shared save flow (rule-set tabs)

Hook: `useDispatchRuleSet.js`

1. Overview theke active rule set id (best-effort)
2. `getWorkingOrCreate` — empty hole default DRAFT create
3. UI edit → **merge/patch draft** (`PATCH /admin/dispatch-rules/:id`)
4. Live engine change hoy **Activate** er pore (`POST .../activate`) — version bump, immutable publish
5. Optional: Simulate (no offers), Test mode, Pause, Rollback

**Important:** “Save Changes” ≠ live dispatch. Live = Activate.

Radius Expansion UI ei pattern explicitly follow kore (Save Changes → then Activate).

---

## 5. Tab details (implementation)

### 5.1 Dispatch Rules

- Gates 1–3, vendor acceptance windows, stacking/radius pointers live in rule set JSON
- Lifecycle controls: activate / test / pause / rollback

### 5.2 Champ Scoring

- FE: `AdminChampScoringPage.jsx` + `useChampScoringEffective` + `useDispatchRuleSet`
- Weights (ETA / CPI factor / load / category) rule set e; must sum **100%**
- CPI tier names, bands, multipliers SLA/DSA theke — Admin e read-only table
- Simulate: `POST /dispatch-rules/:id/simulate` (≤500 orders shadow)

### 5.3 Stacking

- `config.stacking` (T1/T2/T3, liveEnabled)
- Overview `stackingRollout` (Google Maps configured, live allowed)
- `liveEnabled` default false until ops unlock

### 5.4 Radius Expansion

- Stages map to `config.radius` (e.g. 5 / 8 / 12 km + broadcast)
- Expansion delay + no-Champ cancel threshold rule set / overview meta theke
- FE catalog: `radiusExpansionUiCatalog.js` (labels only)

### 5.5 Vendor Status

- Informational only — `vendorStatusUiCatalog.js`
- Live `BranchOperationalStatus` + `openingHours.open|lastOrder|close` = Vendors page
- Checkout block server-side (browse always visible — D-003)

### 5.6 Pay on Delivery

- Service: `podAutomationService.js` (force real API)
- Platform: default max float, warning %, auto float-block
- Champ: `podEnabled`, max float synced with `dailyCashLimit`, cash exposure, reconcile
- **Not** part of DispatchRuleSet
- New champ default float = platform `defaultMaxFloat` (ceiling)

### 5.7 Scheduled Tiers

- Effective Vendor SLA DTO via `GET /admin/dispatch-automation/scheduled-tiers`
- Cutoffs / double-confirm policy SLA models + jobs e

### 5.8 Champ Status

- Buyer labels: ONLINE→AVAILABLE, BUSY→ON_ORDER, OFFLINE→OFFLINE
- Caps / load factors / clocks: `GET .../champ-status` merged into `champStatusUiCatalog`
- Status itself Champ app + engine set kore — Automation reference + live numbers

### 5.9 Audit Log

- `GET /admin/dispatch-automation/log?section=...`
- Sections: acceptance, rule_changes, evaluations, attempts

---

## 6. Backend routes (quick map)

Base: `/api/v1/admin`

```
GET  /dispatch-automation/overview
GET  /dispatch-automation/log
GET  /dispatch-automation/scheduled-tiers
GET  /dispatch-automation/champ-scoring
GET  /dispatch-automation/champ-status

GET/POST /dispatch-rules
GET/PATCH /dispatch-rules/:id
POST /dispatch-rules/:id/activate|simulate|test|pause|rollback
GET  /dispatch-rules/template

GET/PATCH settings          ← POD platform
GET/PATCH fleet/champs...   ← POD per champ + reconcile
```

Module: `Yjeek_teck_backend/src/modules/admin-panel/dispatch-automation/`

---

## 7. Key FE files

| Area | Path |
|------|------|
| Tab nav | `src/components/admin/automation/AutomationTabNav.jsx` |
| Pages | `src/pages/admin/automation/Admin*.jsx` |
| Feature flag | `src/services/admin/dispatchAutomationFeature.js` |
| Rule set hook | `src/hooks/admin/useDispatchRuleSet.js` |
| Rules service | `src/services/admin/dispatchRulesService.js` |
| Automation reads | `src/services/admin/dispatchAutomationService.js` |
| POD | `src/services/admin/podAutomationService.js` |
| Endpoints | `src/api/endpoints.js` → `admin.dispatchAutomation` / `admin.dispatchRules` / fleet / settings |
| Mappers | `src/mappers/admin/mapDispatchAutomation.js`, `mapAdminPodAutomation.js` |

---

## 8. Engine self-check (short)

- Dispatch engine **real** — offers, radius expansion, scoring, stacking flags rule set + workers diye chole
- Admin Automation = config + reference UI over that engine
- Kichu tab **reference-only** (Vendor Status; Champ Status labels)
- Dispatch Rules / Audit er older mock fallbacks flag off hole dekhte pare — production e `automation` feature on rakha

---

## 9. Local verify checklist

1. Backend up + Admin login
2. `.env` e `automation` feature list e ache
3. `/admin/automation/dispatch-rules` — rule set name/version ashe (empty hole auto-create)
4. Champ Scoring — weights edit → Save → Activate → Live Orders e behaviour
5. Radius — stage km change → Save → Activate
6. POD — Fleet champ list ashe; float edit Fleet profile e sync
7. Champ Status — caps API theke; “No mock/demo data” subtitle
8. Network tab e `/admin/dispatch-automation/*` + `/admin/dispatch-rules/*` 200

---

## 10. Product decisions (quick)

| ID | Decision |
|----|----------|
| D-001 | Scoring weights **40 / 30 / 20 / 10** (ETA / CPI / load / category); acceptance rate CPI te already — alada score na |
| D-002 | Online: auth after vendor accept, capture after Champ assign; no-Champ → void auth |
| D-003 | Vendor always browsable; checkout blocked when not Open |
| D-004 | Separate timestamps: vendorAccepted / paymentConfirmed / confirmed / dispatchStarted |

---

*Last updated: 2026-09-26 — Admin Automation live wiring + note/callout cleanup.*
