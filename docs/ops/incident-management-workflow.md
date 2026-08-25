# Incident Management & Workflow

Operator playbook for Yjeek ops incidents: what an incident is, who can act, the lifecycle, how the Live Orders board reacts, and which APIs the Admin Panel uses.

Related: [SLA threshold equations](./sla-thresholds.md).

---

## 1. Purpose

An **ops incident** is a tracked exception on an order (or a stand-alone ops event) that requires a dispatcher to acknowledge, act, and close. Incidents are the audit trail for:

- Who opened it (customer report, champ, vendor, system, or admin)
- Who acknowledged it
- Who resolved it and with what outcome
- Which order action was taken (reassign, refund, cancel, …)

The **Incidents Log** on Live Dashboard, Live Orders, Pickup, Dine-in, Services, and Scheduled is the working queue. Clicking a row opens history and the resolver.

---

## 2. Data model

Table: `ops_incidents` (`OpsIncident`).

| Field | Values / notes |
| --- | --- |
| `id` | CUID |
| `orderId` | Optional. Most live incidents are order-linked |
| `priority` | `P1` `P2` `P3` `P4` (default `P3`) |
| `status` | `OPEN` → `PENDING` (acked) → `RESOLVED` |
| `type` | Free string, max 80 (examples below) |
| `title` | Short operator label |
| `note` | Free text; resolve may append `Outcome: …` |
| `cause` | `VENDOR` `CHAMP` `CUSTOMER` `SYSTEM` `UNKNOWN` |
| `stage` | Optional order-stage hint (e.g. pickup, transit) |
| `reportedByCustomer` | Boolean |
| `acknowledgedAt` / `acknowledgedById` / `acknowledgedByName` | Set on first ack |
| `resolvedAt` / `resolvedById` / `resolvedByName` | Set on resolve; shown in the Admin detail panel |
| `metadata` | JSON |
| `createdAt` / `updatedAt` | SLA clocks start at `createdAt` |

There is no separate history table. The Admin UI builds a timeline from **Opened**, **Acknowledged**, and **Resolved** timestamps plus actor names (`GET /admin/incidents/:id`).

---

## 3. Priorities

| Priority | Meaning (ops) | Default ack | Default resolve |
| --- | --- | --- | --- |
| **P1** | Safety, SOS, payment-critical, duty-manager broadcast | 2 min | 30 min |
| **P2** | Delivery blocked (wrong address, champ no-show, age-restricted return) | 5 min | 1 h |
| **P3** | Quality / missing item / delay complaint | 10 min | 4 h |
| **P4** | Informational, follow-up, low impact | 30 min | 24 h |

Priority is chosen at create time (admin, champ report, or system job). It does **not** change the Live Orders bucket by itself: **any open/pending incident makes the order Critical**. Priority only drives dispatcher SLA scoring.

---

## 4. Typical types (non-exhaustive)

`type` is a string. Common values in product code:

| Type | Typical source | Typical priority |
| --- | --- | --- |
| Dispatch broadcast / duty manager | Dispatch alerts | P1 |
| Champ SOS / emergency | Champ app | P1 |
| Secure delivery return | Champ | P2 |
| Age verification return | Champ | P2 |
| Customer report (job/order) | Champ or customer | P2–P3 |
| Vendor no-response / accept miss | Vendor-acceptance job | P1 |
| Admin-created | Live Orders “incident” on a card | as selected |

Unknown types are valid; treat them like any other ticket: ack, act, resolve.

---

## 5. Who creates incidents

| Actor | How |
| --- | --- |
| **Admin / dispatcher** | `POST /admin/incidents` (permission `LIVE_DASHBOARD` + `CREATE`) or order-card incident flow |
| **Champ** | Delivery report / SOS / return flows in the driver API (creates `OpsIncident` with cause CHAMP / VENDOR / CUSTOMER) |
| **System** | Dispatch ops alerts, vendor-accept timeout, SLA jobs |
| **Customer** | Customer chat or support path that results in `reportedByCustomer = true` (or champ filing on their behalf) |

Customers do not call `/admin/incidents` directly.

---

## 6. Lifecycle

```
                    create
                      │
                      ▼
                   OPEN ──────────────► (optional) reopen from RESOLVED
                      │
         POST …/acknowledge
                      │
                      ▼
                  PENDING
                      │
         resolve / refund / cancel / MARK_RESOLVED
                      │
                      ▼
                  RESOLVED
```

### 6.1 Open

- Status `OPEN`.
- Linked order (if any) is **Critical** on the live board (`openIncidentCount > 0`).
- Appears in Incidents Log (sorted open first, then newest).
- Ack SLA clock is running.

### 6.2 Acknowledge

`POST /admin/incidents/:incidentId/acknowledge`  
Permission: `LIVE_DASHBOARD` + `EDIT`.

- Sets `acknowledgedAt`, `acknowledgedById`, `acknowledgedByName` (admin display name).
- Moves status `OPEN` → `PENDING`.
- Idempotent if already acknowledged (returns current record).
- Rejected if already `RESOLVED`.
- If `(ackedAt − createdAt) > ackSec(priority)`, a dispatcher SLA breach is recorded (`dispatcher.incident_acknowledgement`).

Ops meaning: “I own this ticket.” The order stays **Critical** until resolve.

### 6.3 Act (optional, order-linked)

`POST /admin/incidents/:incidentId/actions`

| Action | Effect on incident | Effect on order |
| --- | --- | --- |
| `REASSIGN_CHAMP` | Status `PENDING` | New champ |
| `REDISPATCH` | Status `PENDING` | Dispatch again |
| `REFUND_FULL` / `REFUND_PARTIAL` | **RESOLVED**, `resolvedByName` set | Wallet / payment refund |
| `CANCEL` | **RESOLVED**, `resolvedByName` set | Order cancelled |
| `SUSPEND_CHAMP` | Status `PENDING` | Champ suspension |
| `FLAG_VENDOR` | Incident status **unchanged** | Vendor flag row |
| `MARK_RESOLVED` | Same as resolve | None beyond closing the ticket |

Actions other than `MARK_RESOLVED` require `orderId`.

### 6.4 Resolve

`POST /admin/incidents/:incidentId/resolve` with optional `{ outcome }`.

- Status `RESOLVED`.
- If never acked, ack fields are filled with the resolver (ack and resolve can be the same person/time).
- `resolvedAt`, `resolvedById`, `resolvedByName` set.
- Outcome appended to `note` as `Outcome: …`.
- Late resolve vs `incidentResolveSecByPriority` writes a dispatcher resolve SLA breach.
- Linked order leaves Critical **unless** another open incident remains or another Critical rule applies (age ≥ 25 min, accept breach). A resolved report can still leave the order **At Risk** (`reportedIncidentCount > 0`).

### 6.5 Reopen

`POST /admin/incidents/:incidentId/reopen`

- Status back to `OPEN`.
- Clears `resolvedAt`, `resolvedById`, `resolvedByName`.
- Does **not** clear acknowledge fields.
- Order returns to **Critical**.

---

## 7. Operator workflow (Live Orders)

1. Watch **Critical** first, then Incidents Log (P1 at top of the feed).
2. Click the incident row → detail modal:
   - Title, priority, status, type, cause, note
   - Linked order number (open order detail)
   - Timeline: Opened (reporter/system) → Acknowledged (name) → Resolved (name)
3. Acknowledge immediately if you will work it (P1 within 2 minutes).
4. Contact Champ / Customer from the order card chat (pinned chats strip stays visible).
5. Take the smallest action that unblocks delivery (reassign / redispatch) before refund/cancel.
6. Resolve with a one-line outcome. Confirm `resolvedByName` is your admin display name.
7. Confirm the order card moved out of Critical if no other open incidents exist.

Vendor filter and column scroll do not change this workflow; they only change what is visible on the board.

---

## 8. Board coupling (all incident types)

From [SLA thresholds](./sla-thresholds.md):

```
open/pending incident on order  →  order bucket = Critical
resolved-only report            →  At Risk (if not otherwise Critical)
no incidents                    →  age / status / accept rules
```

This is independent of P1–P4 and independent of vendor/champ/dispatcher SLA model numbers. Those models only score the **people**; the board scores the **order**.

---

## 9. Admin API

Base: `{API}/admin/incidents`  
Auth: admin bearer. Feature flag: dashboard. Permission module: `LIVE_DASHBOARD`.

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/summary` | VIEW | Open / pending / resolved / P1 counts |
| GET | `/` | VIEW | List (`status`, `priority`, `orderId`, `search`, `page`, `limit`) |
| GET | `/:incidentId` | VIEW | Detail + resolver + available order actions |
| POST | `/` | CREATE | Create |
| POST | `/:incidentId/acknowledge` | EDIT | Ack |
| POST | `/:incidentId/resolve` | EDIT | Close |
| POST | `/:incidentId/reopen` | EDIT | Reopen |
| POST | `/:incidentId/actions` | EDIT | Order remediation |

List query defaults: `status=all`, `priority=all`, `limit=50`.

UI wiring:

- Incidents Log → `GET /admin/incidents`
- Click row → `GET /admin/incidents/:id` → `AdminIncidentDetailModal` (history + `resolvedByName`)

Older feed `GET /admin/dashboard/incidents` is not the primary log.

---

## 10. Permissions and audit

| Action | Permission |
| --- | --- |
| See log / detail | `LIVE_DASHBOARD` VIEW |
| Create | CREATE |
| Ack / resolve / reopen / actions | EDIT |

Audit module: `LIVE_DASHBOARD`. Actions logged include create, acknowledge, resolve, reopen. Resolver identity is the admin **display name** stored on the incident row (not only the audit log).

---

## 11. Chat vs incidents

A customer starting a chat is **not** an incident. Chat appears on the pinned **chats** strip (`GET /admin/dashboard/chats`) once the order conversation exists (champ assignment is **not** required). Escalate to an incident when the thread needs a tracked outcome, SLA, or order action.

---

## 12. Definition of done for a ticket

An incident is done when:

1. Status is `RESOLVED`
2. `resolvedByName` is set
3. Outcome is in `note` (or implied by refund/cancel)
4. Linked order is in the expected bucket (not Critical unless another incident remains)
5. Dispatcher ack/resolve SLA is either met or an accepted, recorded breach
