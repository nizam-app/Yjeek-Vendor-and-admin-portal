# SLA threshold equations

This document defines when a live order stays **On Track**, moves to **At Risk**, or becomes **Critical**, and how those buckets relate to every SLA type (vendor, champ, dispatcher) and every incident.

Source of truth in code:

- Live / Pickup / Dine-in / Services board buckets: `evaluateOrderRisk()` in `sla-evaluation.service.ts`, wrapped by `riskForOrder()` in `admin-dashboard.service.ts`
- Per-metric tier targets: `{ target, atRisk, critical }` seconds in `sla-config.ts` (overridable per SLA model; snapshotted per order)
- Incident ack / resolve clocks: dispatcher `incidentAckSecByPriority` and `incidentResolveSecByPriority`

Times below are **defaults**. Configured SLA models replace the matching target; the **board bucket equations do not change**.

---

## Notation

| Symbol | Meaning |
| --- | --- |
| `t0` | Clock start: `prepStartedAt` if set, otherwise `order.createdAt` |
| `elapsedMin` | Minutes from active clock start (metric-specific; see evaluator) |
| `acceptDeadline` | `order.vendorAcceptDeadline` |
| `status` | Current `OrderStatus` |
| `openIncidents` | Count of incidents on the order with status `OPEN` or `PENDING` |
| `reportedIncidents` | Count of incidents on the order that were reported |
| `slaBreached` | Order-level breach flag that forces **Critical** |
| `tier` | `{ target, atRisk, critical }` seconds for the active metric |

---

## Live board buckets (all order types)

Buckets are computed by `evaluateOrderRisk()` using configured **three-tier** thresholds per active metric. The **worst** metric status wins.

### Per-metric bands (lower elapsed is better)

```
on_track   ⇔  actualSec ≤ target
at_risk    ⇔  actualSec > atRisk   (and ≤ critical)
critical   ⇔  actualSec > critical
```

Active metrics (v1):

| Order stage | Metric | Clock start |
|-------------|--------|-------------|
| `PLACED` / `PENDING_VENDOR_ACCEPT` | `vendor.acceptance` | `createdAt` |
| `PREPARING` | `vendor.preparation` | `prepStartedAt` |
| `SEARCHING_DRIVER` / `AWAITING_DRIVER_CONFIRM` (no driver) | `dispatcher.assignment` | `createdAt` |
| Fallback (no stage timer) | `board.elapsed` | `prepStartedAt ?? createdAt` |

Config comes from the order **SLA snapshot** when present, otherwise platform `DEFAULT_SLA_CONFIG`.

Default `boardOrderElapsedSec` tiers: target **8 min**, at-risk **12 min**, critical **25 min**.

### Critical override (incidents)

An order is **Critical** immediately when:

```
openIncidents > 0
```

This overrides all SLA tier math. Auto-created SLA incidents (from the monitor at at-risk / critical) also trigger this rule.

### Decision order

1. If `openIncidents > 0` → **Critical**
2. Else evaluate active metrics → worst of `on_track` / `at_risk` / `critical`
3. Map to board bucket labels: On Track / At Risk / Critical

There is no hysteresis: crossing a threshold on the next poll moves the card immediately.

### Legacy note

Older docs referenced fixed **12 min** (at risk) and **25 min** (critical) age rules and **PREPARING → at risk**. Those are replaced by tier evaluation above. The 12 / 25 values remain as the default **board elapsed** at-risk and critical tiers unless changed in SLA Models.

---

## How incidents interact with buckets

Applies to **all incident types** (`OpsIncident.type` string) and **all priorities** (P1–P4) and **all causes** (VENDOR, CHAMP, CUSTOMER, SYSTEM, UNKNOWN).

| Incident state on the order | Board effect |
| --- | --- |
| `OPEN` or `PENDING` (`openIncidents > 0`) | **Critical** (overrides age and status) |
| Reported, then `RESOLVED` (`openIncidents = 0`, `reportedIncidents > 0`) | **At Risk** unless some other Critical rule fires |
| Never reported | Age / status / accept rules only |

Dispatcher **ack** and **resolve** clocks (below) do **not** change the order’s board bucket. They score the dispatcher. The order stays Critical for as long as the incident remains open/pending.

---

## Dispatcher incident SLA (all incident types)

Clock starts at `incident.createdAt`. Priority comes from the incident (`P1`–`P4`).

Default acknowledge targets (`incidentAckSecByPriority`):

| Priority | Acknowledge by | Default |
| --- | --- | --- |
| P1 | `now − createdAt ≤ ack` | **2 min** |
| P2 | same | **5 min** |
| P3 | same | **10 min** |
| P4 | same | **30 min** |

Default resolve targets (`incidentResolveSecByPriority`):

| Priority | Resolve by | Default |
| --- | --- | --- |
| P1 | `now − createdAt ≤ resolve` | **30 min** |
| P2 | same | **1 hour** |
| P3 | same | **4 hours** |
| P4 | same | **24 hours** |

```
ackBreached     ⇔  acknowledgedAt is set AND (acknowledgedAt − createdAt) > ackSec(priority)
                  OR still unacked AND (now − createdAt) > ackSec(priority)

resolveBreached ⇔  resolvedAt is set AND (resolvedAt − createdAt) > resolveSec(priority)
                  OR still open/pending AND (now − createdAt) > resolveSec(priority)
```

Late ack writes `dispatcher.incident_acknowledgement`. Late resolve writes the matching resolve metric. Reopen clears resolve fields and returns status to `OPEN`; a new resolve clock is **not** reset on `createdAt` (the original create time remains the SLA start).

---

## Vendor SLA types → accept / prep (defaults)

These targets drive `vendorAcceptDeadline` and kitchen/work timers. They do **not** replace the 12 / 25 minute board equations; they explain *why* an accept breach or long elapsed time happened.

### Hot food — on demand

| Metric | Default | Board mapping |
| --- | --- | --- |
| Vendor accept | 2 min | Missed while still `PLACED` / `PENDING_VENDOR_ACCEPT` → **Critical** (`acceptBreached`) |
| Prep limit | 15 min | Age past 12 min → **At Risk**; past 25 min → **Critical** |
| Champ collection | 10 min | Operational; does not change bucket by itself |
| Customer issue response | 5 min | If an incident is opened, order → **Critical** |

### Pickup

| Metric | Default |
| --- | --- |
| Vendor accept | 3 min |
| Prep limit | 15 min |
| Customer wait | 10 min |
| Handover | 3 min |
| Late pickup grace | 15 min |

Same board equations. Accept miss while pending accept → Critical. Prep / wait overruns show as elapsed age (At Risk at 12 min, Critical at 25 min) or via an open incident.

### Dine-in

| Metric | Default |
| --- | --- |
| Vendor accept | 3 min |
| Customer arrival wait | 10 min |
| Table preparation | 8 min |
| Issue response | 5 min |
| No-show grace | 15 min |

Same board equations. `PREPARING` / seated work still trips At Risk via status or age.

### Groceries

| Metric | Default |
| --- | --- |
| Vendor accept | 2 min |
| Customer wait | 10 min |

Same board equations.

### Flowers

| Metric | Default |
| --- | --- |
| Vendor accept | 2 min |
| Customer wait | 15 min |
| Max customer wait | 20 min |

Same board equations. 20 min max wait sits between At Risk (12) and Critical (25) on the live board; open an incident if the wait must surface as Critical before 25 min.

### Electronics

| Metric | Default |
| --- | --- |
| Vendor accept | 5 min |
| Prep limit | 20 min |
| Customer wait | 10 min |
| Warranty issue response | 4 h |

Same board equations. Warranty work is an incident path (Critical while open).

### Scheduled delivery (same day / next day / 1–3 / 5–7)

| Metric | Default (same-day tier unless noted) |
| --- | --- |
| Vendor accept | 2 min |
| Champ collection | 15 min |
| Prep time | 2 h (same day); 8 h next day; 24 h / 12 h on longer tiers |
| Cutoff | 12:00 (same day); 22:00 next day |

Scheduled boards use pipeline columns (new / confirmation / on track), **not** these three live buckets. If a scheduled order is also shown on a live-style board, `riskForOrder` still uses 12 / 25 / incidents / accept.

### Services

| Metric | Default |
| --- | --- |
| Vendor accept | 5 min |
| Service-level agreement | 1 h |
| Cancellation lead time | 2 h |
| Quality report window | 24 h |

Same live-board equations. Service SLA overrun should be raised as an incident (Critical) if it must move before the 25-minute age rule.

---

## Champ SLA types (defaults)

Champ delays do not change the board bucket by themselves. They become board-visible when dispatch opens an incident (Critical) or when elapsed age crosses 12 / 25.

| Mode | Accept job | Notes |
| --- | --- | --- |
| Hot food / food | 45 s | Dispatcher assignment target 1 min 30 s (hot food) / 1 min (food) |
| Grocery / pharmacy | 1 min 30 s | Dispatcher assignment 1 min 30 s |
| Flowers | 1 min 30 s | Dispatcher assignment 2 min |
| Electronics | 1 min 30 s | Dispatcher assignment 5 min |
| Same day / next day / standard | 5 min | Dispatcher assignment 3–5 min |
| Economy | 5 min | Dispatcher assignment 10 min |

Performance windows (pickup arrival, vendor wait, customer unreachable) are champ-score metrics. Breach handling: report / incident → **Critical** on the order while the incident is open.

Champ quality tiers (elite / gold / silver / bronze / at-risk) are **score bands**, not order-board buckets:

| Tier | Score |
| --- | --- |
| Elite | 90–100 |
| Gold | 80–89 |
| Silver | 70–79 |
| Bronze | 60–69 |
| At risk (champ) | 0–59 |

---

## Dispatcher assignment SLA (defaults)

Unassigned / late assignment is an ops problem. Board effect is indirect: age → At Risk / Critical, or an incident (for example dispatch broadcast) → Critical.

| Mode | Assign champ by |
| --- | --- |
| Food | 1 min |
| Hot food | 1 min 30 s |
| Grocery / pharmacy | 1 min 30 s |
| Flowers | 2 min |
| Same day | 3 min |
| Electronics / standard / next day | 5 min |
| Economy | 10 min |

Also: reassign window **5 min**, unassigned escalation **10 min**, chat first response **1 min**, vendor / customer chat response **5 min**, champ chat **3 min**.

---

## Worked examples

**A. Fresh hot-food order, no champ yet**  
`elapsedMin = 4`, status `CONFIRMED`, no incidents → **On Track**.

**B. Kitchen started**  
status `PREPARING`, `elapsedMin = 6`, no incidents → **At Risk** (status rule).

**C. Long cook, no ticket**  
`elapsedMin = 18`, no incidents → **At Risk** (12-minute rule).  
`elapsedMin = 26` → **Critical** (25-minute rule).

**D. Vendor ignores accept**  
status still `PENDING_VENDOR_ACCEPT`, `now > vendorAcceptDeadline` → **Critical**.

**E. Customer reports missing item (P3)**  
Incident `OPEN` at minute 8 → **Critical** immediately.  
Dispatcher must ack within 10 min and resolve within 4 h (P3 defaults).  
When resolved, `openIncidents = 0` but `reportedIncidents > 0` → **At Risk** unless age ≥ 25.

**F. P1 champ SOS**  
Same as E with P1 clocks: ack 2 min, resolve 30 min. Order is Critical while the incident is open.
