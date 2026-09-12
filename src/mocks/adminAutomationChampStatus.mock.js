import { createDuration } from './adminAutomationDispatchRules.mock'

/** Frontend mock / reference source for Automation → Champ Status. */

export function createChampStatusEditableDefaults() {
  return {
    breakReminder: createDuration('≥', 0, 30, 0),
    gpsOfflineTimeout: createDuration('≥', 0, 5, 0),
    incidentCustomerNotify: true,
    reassignmentDeadline: createDuration('≤', 0, 5, 0),
    suspendedAutoLift: true,
    preLockWindow: createDuration('−', 0, 30, 0),
  }
}

export function getChampStatusMock() {
  return {
    header: {
      title: 'Champ Status Reference',
      subtitle:
        'Every possible status · what triggers it · what automation fires · what the developer must implement',
    },
    rootCallout: {
      label: 'Developer note — status is the root of all dispatch logic',
      body: 'Every automation decision starts by reading champ.status. Status is the single field the dispatch engine reads first — at Gate 1, before any scoring. Get this wrong and dispatch is broken. Status transitions must be atomic — no partial states. Each status has exactly one set of triggers (what causes it) and one set of automation consequences (what the system does when it reads it). Statuses set by the system are never manually overridable by the Champ app. Statuses set by Admin or Dispatcher are logged with who set them, when, and why.',
    },
    statuses: {
      available: {
        key: 'AVAILABLE',
        title: 'AVAILABLE',
        subtitle: 'Champ is online, has capacity, and can receive orders',
        headerBg: '#f0fdf4',
        titleColor: '#15803d',
        dotColor: '#16a34a',
        badge: '● Dispatch eligible',
        badgeClassName: 'bg-[#dcfce7] text-[#15803d]',
        rows: [
          {
            id: 'set-by',
            label: 'Set by',
            help: 'System — automatically when Champ goes online in Champ app and passes all capacity checks',
            pill: { tone: 'on', text: 'System-set' },
          },
          {
            id: 'triggers',
            label: 'Triggers that set this status',
            help: 'Champ opens Champ app and taps Go Online · order delivered and active_orders drops below cap · break ends and Champ taps Resume · suspension lifted by Admin',
            pill: { tone: 'on', text: 'Auto-transition' },
          },
          {
            id: 'dispatch',
            label: 'Dispatch engine behaviour',
            help: 'Passes Gate 1. Enters scoring pool. Ranked by ETA (40%) + CPI tier (30%) + active load (20%) + category fit (10%). Can receive offer.',
            pill: { tone: 'on', text: 'Eligible for offers' },
          },
          {
            id: 'dashboard',
            label: 'Live Dashboard indicator',
            help: 'Green dot on Champ card. Counted in "Available Champs" KPI tile.',
            pill: {
              text: '● Available',
              className: 'bg-[#dcfce7] text-[#15803d]',
            },
          },
        ],
        schema: ["champ.status = 'AVAILABLE'"],
      },
      onOrder: {
        key: 'ON_ORDER',
        title: 'ON_ORDER',
        subtitle: 'Champ has accepted an order and is actively fulfilling it',
        headerBg: '#eff6ff',
        titleColor: '#1d4ed8',
        dotColor: '#2563eb',
        badge: '● Active — may receive stack',
        badgeClassName: 'bg-[#dbeafe] text-[#1d4ed8]',
        rows: [
          {
            id: 'set-by',
            label: 'Set by',
            help: 'System — automatically when Champ accepts an order offer',
            pill: { tone: 'on', text: 'System-set' },
          },
          {
            id: 'triggers',
            label: 'Triggers that set this status',
            help: 'Champ taps Accept on order offer in Champ app',
            pill: { tone: 'on', text: 'Auto on accept' },
          },
          {
            id: 'dispatch',
            label: 'Dispatch engine behaviour',
            help: 'Still in pool — active_orders increments. Can receive additional orders via stacking triggers (T1, T2, T3) if active_orders < vehicle cap (car = 3). Score penalised by load factor: 1 order = 0.75×, 2 orders = 0.50×. At cap → excluded from new offers.',
            pill: { tone: 'warn', text: 'Stack eligible until cap' },
          },
          {
            id: 'exits',
            label: 'Exits to',
            help: 'AVAILABLE — when last active order is delivered and confirmed. INCIDENT — if vehicle breakdown or emergency reported.',
            pill: { tone: 'on', text: 'Auto on last delivery' },
          },
          {
            id: 'dashboard',
            label: 'Live Dashboard indicator',
            help: 'Blue dot. Counted in "On Order" KPI. Map pin shows route line.',
            pill: {
              text: '● On Order',
              className: 'bg-[#dbeafe] text-[#1d4ed8]',
            },
          },
        ],
        schema: ["champ.status = 'ON_ORDER'", 'champ.active_orders = N (1–3)'],
      },
      stacked: {
        key: 'ON_ORDER_STACKED',
        derived: true,
        title: 'ON_ORDER · STACKED (N)',
        titleNote: '— computed display label, not a stored enum',
        subtitle:
          'Champ has more than one active order. The count N reflects champ.active_orders. Derived at read time — never written to the database as a status value.',
        headerBg: '#eff6ff',
        titleColor: '#1d4ed8',
        dotColor: '#2563eb',
        stackedAccent: true,
        badge: '● Active · Multi-order',
        badgeClassName: 'bg-[#dbeafe] text-[#1d4ed8]',
        architectureCallout: {
          label: 'Architecture rule — derived label, not a stored enum',
          body: "champ.status stays 'ON_ORDER' in the database throughout. The stacked label is computed at read time by the API layer: if active_orders > 1, format the display as ON_ORDER · STACKED (N) where N = active_orders. Never store ON_ORDER_STACKED_2 as an enum value — you would need a new migration every time the cap changes and a status write on every delivery confirmation. One integer field does the job.",
        },
        maintenanceTitle: 'How active_orders is maintained',
        maintenanceRows: [
          {
            id: 'inc',
            label: 'Increments when',
            help: 'Champ accepts a stacked offer (T1, T2, or T3 trigger). System writes: active_orders = active_orders + 1',
            code: 'active_orders++',
          },
          {
            id: 'dec',
            label: 'Decrements when',
            help: 'Customer confirms delivery OR system auto-confirms after delivery timeout. System writes: active_orders = active_orders − 1. When it reaches 0, champ.status flips to AVAILABLE.',
            code: 'active_orders--',
          },
          {
            id: 'cap',
            label: 'Hard cap enforced at Gate 1',
            help: 'Vehicle cap (car = 3, bike = 2) is checked in Gate 1 before any offer is sent. If active_orders ≥ vehicle_cap, Champ fails Gate 1 and receives no more offers regardless of stacking triggers.',
            pill: { tone: 'off', text: 'Excluded at cap' },
          },
        ],
        displayTableTitle:
          'Display labels — computed by API, shown on Live Dashboard and Champ card',
        displayRows: [
          {
            status: 'ON_ORDER',
            orders: '1',
            label: '● ON_ORDER',
            labelClass: 'bg-[#dbeafe] text-[#1d4ed8]',
            load: '0.75×',
            loadClass: 'text-[#d97706]',
            eligible: true,
            eligibleText: '✓ Yes — if under cap',
          },
          {
            status: 'ON_ORDER',
            orders: '2',
            label: '● ON_ORDER · STACKED (2)',
            labelClass: 'bg-[#dbeafe] text-[#1d4ed8]',
            load: '0.50×',
            loadClass: 'text-[#ea580c]',
            eligible: true,
            eligibleText: '✓ Yes — if cap = 3 (car)',
          },
          {
            status: 'ON_ORDER',
            orders: '3',
            label: '● ON_ORDER · STACKED (3) · AT CAP',
            labelClass: 'bg-[#ffedd5] text-[#9a3412]',
            load: 'N/A',
            loadClass: 'text-[#dc2626]',
            eligible: false,
            eligibleText: '✗ No — Gate 1 excludes',
          },
          {
            status: 'ON_ORDER',
            orders: '2 (bike)',
            label: '● ON_ORDER · STACKED (2) · AT CAP',
            labelClass: 'bg-[#ffedd5] text-[#9a3412]',
            load: 'N/A',
            loadClass: 'text-[#dc2626]',
            eligible: false,
            eligibleText: '✗ No — bike cap = 2',
          },
        ],
        scoringTitle: 'Scoring impact — active load factor (20% of dispatch score)',
        scoringRows: [
          {
            id: '1',
            label: 'active_orders = 1',
            help: 'Single order. Standard load penalty applied.',
            value: '0.75×',
            valueClass: 'text-[#d97706]',
            hint: 'on the 20% load component',
          },
          {
            id: '2',
            label: 'active_orders = 2',
            help: 'Stacked. Higher load penalty — score suppressed significantly.',
            value: '0.50×',
            valueClass: 'text-[#ea580c]',
            hint: 'on the 20% load component',
          },
          {
            id: 'cap',
            label: 'active_orders ≥ cap',
            help: 'At or beyond vehicle cap. Never reaches scoring — excluded at Gate 1.',
            pill: { tone: 'off', text: 'Gate 1 excluded — not scored' },
          },
        ],
        dashboardTitle: 'Live Dashboard — what ops sees',
        dashboardRows: [
          {
            id: 'map',
            label: 'Champ card on map',
            help: 'Blue pin. Number badge on pin shows active_orders count. Badge turns amber at active_orders = 2, red at cap.',
            badges: [
              { text: '📍 1', className: 'bg-[#dbeafe] text-[#1d4ed8]' },
              { text: '📍 2', className: 'bg-[#fef9c3] text-[#854d0e]' },
              { text: '📍 3 CAP', className: 'bg-[#fee2e2] text-[#991b1b]' },
            ],
          },
          {
            id: 'list',
            label: 'Champ list row label',
            help: 'Shown in the Champ list panel alongside status. Computed by frontend from status + active_orders fields returned by the API.',
            code: 'API returns: status, active_orders → UI computes label',
          },
          {
            id: 'kpi',
            label: 'KPI tile — "On Order" count',
            help: 'All Champs with active_orders ≥ 1 counted here, regardless of stacking. Stacked count shown as a sub-label: "14 On Order · 6 stacked".',
            pill: { tone: 'on', text: 'Aggregate + stacked breakdown' },
          },
        ],
        schemaTitle: 'Schema — what is stored vs what is computed',
        stored: [
          "champ.status = 'ON_ORDER'  ← never changes while carrying orders",
          'champ.active_orders = N  ← integer, atomic increment/decrement',
          "champ.vehicle_type = 'BIKE' | 'CAR' | 'CARGO'  ← determines cap",
        ],
        computed: [
          'display_status = active_orders > 1 ? `ON_ORDER · STACKED (${active_orders})` : \'ON_ORDER\'',
          'at_cap = active_orders >= vehicle_cap_map[vehicle_type]',
          'load_multiplier = active_orders === 1 ? 0.75 : 0.50',
        ],
        neverStore: "champ.status = 'ON_ORDER_STACKED_2'  ← WRONG — do not do this",
      },
      onBreak: {
        key: 'ON_BREAK',
        title: 'ON_BREAK',
        subtitle: 'Champ has voluntarily paused availability — no new orders can be assigned',
        headerBg: '#fafafa',
        titleColor: '#374151',
        dotColor: '#9ca3af',
        badge: '● Paused — not eligible',
        badgeTone: 'off',
        rows: [
          {
            id: 'set-by',
            label: 'Set by',
            help: 'Champ — taps Go on Break in Champ app. Can only be set when active_orders = 0.',
            pill: { tone: 'warn', text: 'Champ-initiated' },
          },
          {
            id: 'dispatch',
            label: 'Dispatch engine behaviour',
            help: 'Fails Gate 1 immediately. Not scored. No offers sent. Invisible to dispatch engine.',
            pill: { tone: 'off', text: 'Excluded — Gate 1 fail' },
          },
          {
            id: 'automation',
            label: 'Automation rule',
            help: 'If Champ stays ON_BREAK beyond the configured max break duration, system sends a push notification reminder. If still on break after second threshold, ops team is notified. No auto-suspend — human decision required.',
            control: 'breakReminder',
            controlHint: '→ push reminder',
          },
          {
            id: 'exits',
            label: 'Exits to',
            help: 'AVAILABLE — when Champ taps Resume in Champ app',
            pill: { tone: 'on', text: 'Champ-initiated resume' },
          },
          {
            id: 'cpi',
            label: 'CPI impact',
            help: 'Break time counts against online hours component if total daily online time falls below minimum threshold per category SLA.',
            pill: { tone: 'warn', text: 'May affect CPI online hours' },
          },
        ],
        schema: ["champ.status = 'ON_BREAK'", 'champ.break_started_at = timestamp'],
      },
      offline: {
        key: 'OFFLINE',
        title: 'OFFLINE',
        subtitle: 'Champ has closed the Champ app or gone offline — not available for any orders',
        headerBg: '#fafafa',
        titleColor: '#6b7280',
        dotColor: '#d1d5db',
        badge: '● Offline — not eligible',
        badgeTone: 'off',
        rows: [
          {
            id: 'set-by',
            label: 'Set by',
            help: 'System — when Champ taps Go Offline in Champ app, closes the app, or GPS signal is lost beyond the configured timeout',
            pill: { tone: 'on', text: 'System-set' },
          },
          {
            id: 'gps',
            label: 'GPS loss → OFFLINE timeout',
            help: 'If GPS signal lost while status is AVAILABLE or ON_ORDER, system waits this long before flipping to OFFLINE and triggering ops alert',
            control: 'gpsOfflineTimeout',
          },
          {
            id: 'dispatch',
            label: 'Dispatch engine behaviour',
            help: 'Fails Gate 1. Not scored. No offers sent.',
            pill: { tone: 'off', text: 'Excluded — Gate 1 fail' },
          },
          {
            id: 'critical',
            label: 'Critical automation — OFFLINE while ON_ORDER',
            help: 'If Champ goes OFFLINE while carrying an active order (GPS loss or app closed), ops alert fires immediately. Dispatcher must assess — this is one of the permitted dispatcher intervention scenarios (potential vehicle incident). System does NOT auto-reassign — dispatcher decides.',
            pill: {
              text: '⚠ Ops alert — dispatcher assesses',
              className: 'bg-[#fee2e2] text-[#991b1b]',
            },
          },
        ],
        schema: ["champ.status = 'OFFLINE'", 'champ.last_seen_at = timestamp'],
      },
      incident: {
        key: 'INCIDENT',
        title: 'INCIDENT',
        subtitle:
          'Champ has reported a physical incident — vehicle breakdown, accident, or emergency — while carrying active orders',
        headerBg: '#fff7ed',
        titleColor: '#c2410c',
        dotColor: '#ea580c',
        badge: '⚠ Dispatcher must act',
        badgeClassName: 'bg-[#ffedd5] text-[#9a3412]',
        callout: {
          tone: 'red',
          label: 'This is the primary permitted dispatcher intervention',
          body: 'INCIDENT is one of the few statuses where dispatcher action is mandatory. The system cannot auto-reassign active orders without knowing the physical context — the Champ may have the items in the vehicle. Dispatcher calls the Champ, assesses the situation, and manually triggers reassignment for each affected order.',
        },
        rows: [
          {
            id: 'set-by',
            label: 'Set by',
            help: 'Champ — taps Report Incident in Champ app. OR Dispatcher sets manually in Admin when Champ calls ops directly.',
            pill: { tone: 'warn', text: 'Champ or Dispatcher-set' },
          },
          {
            id: 'dispatch',
            label: 'Dispatch engine behaviour',
            help: 'Fails Gate 1 immediately. All pending offers for this Champ cancelled. Champ removed from pool. Active orders flagged for manual reassignment review.',
            pill: { tone: 'off', text: 'Excluded — Gate 1 fail' },
          },
          {
            id: 'automation',
            label: 'Automation on INCIDENT set',
            help: '1 — All active orders on this Champ flip to "Champ Incident" flag on Live Dashboard. 2 — Ops alert fires with Champ ID, active order list, Champ last GPS location. 3 — Dispatcher notified with one-click reassignment action per affected order. 4 — Customer push notification: "Your order has been affected by an unexpected situation. We are reassigning your Champ now." 5 — Timer starts for customer SLA breach if reassignment exceeds configured threshold.',
            pill: {
              text: 'Auto-alert · dispatcher reassigns',
              className: 'bg-[#fee2e2] text-[#991b1b]',
            },
          },
          {
            id: 'notify',
            label: 'Customer notification — auto-send on INCIDENT',
            control: 'incidentCustomerNotify',
            toggleLabel: 'Always send immediately',
          },
          {
            id: 'deadline',
            label: 'Reassignment deadline — dispatcher must act within',
            help: 'After this threshold, ops manager is also alerted if no reassignment has been made',
            control: 'reassignmentDeadline',
          },
          {
            id: 'exits',
            label: 'Exits to',
            help: 'SUSPENDED — after incident is resolved and reviewed. Champ cannot self-recover to AVAILABLE from INCIDENT. Admin must clear the status after incident review is complete.',
            pill: { tone: 'warn', text: 'Admin clears to SUSPENDED or AVAILABLE' },
          },
        ],
        schema: [
          "champ.status = 'INCIDENT'",
          'champ.incident_reported_at = timestamp',
          'champ.incident_type = enum',
          'champ.incident_notes = text',
        ],
      },
      suspended: {
        key: 'SUSPENDED',
        title: 'SUSPENDED',
        subtitle:
          'Champ has been removed from all dispatch operations by Admin · can be temporary or permanent',
        headerBg: '#fef2f2',
        titleColor: '#b91c1c',
        dotColor: '#dc2626',
        badge: '✗ Not eligible — Admin action required',
        badgeClassName: 'bg-[#fee2e2] text-[#991b1b]',
        rows: [
          {
            id: 'set-by',
            label: 'Set by',
            help: 'Admin or Dispatcher only — never automatic. Suspension is always a human decision. Reason and duration must be recorded at time of suspension.',
            pill: {
              text: 'Admin / Dispatcher only',
              className: 'bg-[#fee2e2] text-[#991b1b]',
            },
          },
          {
            id: 'reasons',
            label: 'Common reasons for suspension',
            help: 'CPI At Risk not self-recovering · repeated incidents · cash handling dispute · conduct violation (per DSA Schedule C) · legal / HR matter · Champ request · post-incident review pending',
            pill: { tone: 'warn', text: 'Reason logged at suspension' },
          },
          {
            id: 'dispatch',
            label: 'Dispatch engine behaviour',
            help: 'Fails Gate 1 immediately — status check. Not scored. No offers. Invisible to dispatch. Under Watch and At Risk CPI Champs who are NOT suspended remain in pool with suppressed multipliers (0.40× and 0.20×) — suspension is always a separate Admin decision.',
            pill: { tone: 'off', text: 'Excluded — Gate 1 fail' },
          },
          {
            id: 'auto-lift',
            label: 'Temporary suspension — auto-lift',
            help: 'If suspension_type = TEMPORARY and suspension_end_at is set, system automatically transitions Champ to AVAILABLE at that datetime. Push notification sent to Champ. Ops notified.',
            control: 'suspendedAutoLift',
            toggleLabel: 'Auto-lift on suspension_end_at',
          },
          {
            id: 'permanent',
            label: 'Permanent suspension — manual lift only',
            help: 'suspension_type = PERMANENT requires explicit Admin action to lift. No auto-transition.',
            pill: { tone: 'off', text: 'Manual Admin action only' },
          },
          {
            id: 'active',
            label: 'Active orders at time of suspension',
            help: 'If Champ has active_orders > 0 when suspended, system triggers same flow as INCIDENT — ops alert, dispatcher must reassign each affected order manually.',
            pill: {
              text: 'Triggers reassignment flow',
              className: 'bg-[#fee2e2] text-[#991b1b]',
            },
          },
        ],
        schema: [
          "champ.status = 'SUSPENDED'",
          'champ.suspended_at = timestamp',
          'champ.suspended_by = admin_user_id',
          'champ.suspension_reason = text',
          'champ.suspension_type = TEMPORARY | PERMANENT',
          'champ.suspension_end_at = timestamp | null',
        ],
      },
      fleetOccupied: {
        key: 'FLEET_OCCUPIED',
        phase: 2,
        title: 'FLEET_OCCUPIED',
        titleNote: '— Phase 2 · field reserved from day one',
        subtitle:
          'Champ is locked to a B2B contracted Fleet route — completely invisible to consumer dispatch engine',
        headerBg: '#faf5ff',
        titleColor: '#6d28d9',
        dotColor: '#7c3aed',
        badge: 'Phase 2 — Yjeek Fleet',
        badgeTone: 'phase2',
        callout: {
          tone: 'blue',
          label: 'Reserve this enum value now — do not skip it',
          body: 'FLEET_OCCUPIED must exist in the champ.status enum from day one even though the Fleet product does not launch at Phase 1. Adding an enum value to an existing column after launch requires a migration across all active records. Reserve it now at zero cost.',
        },
        rows: [
          {
            id: 'set-by',
            label: 'Set by',
            help: 'System — automatically at Fleet route shift confirmation. Locked for entire route duration per BusinessContract schedule.',
            pill: { tone: 'phase2', text: 'System-set at shift start' },
          },
          {
            id: 'dispatch',
            label: 'Dispatch engine behaviour',
            help: 'Fails Gate 1 at the very first check — before any other eligibility. Completely invisible to consumer dispatch for entire route duration. Cannot be offered consumer orders regardless of supply shortage.',
            pill: { tone: 'off', text: 'Hard excluded — first Gate 1 check' },
          },
          {
            id: 'exits',
            label: 'Exits to',
            help: 'AVAILABLE — automatically when Fleet route is completed and shift ends, per BusinessRoutePlan.end_time. Never manual.',
            pill: { tone: 'phase2', text: 'Auto at route end' },
          },
        ],
        schemaLabel: 'Schema fields — reserve all from day one',
        schema: [
          "champ.status = 'FLEET_OCCUPIED'",
          'VehicleAssignment.champ_id (Phase 2 table)',
          'BusinessRoutePlan.start_time / end_time',
        ],
      },
      scheduledLocked: {
        key: 'SCHEDULED_LOCKED',
        title: 'SCHEDULED_LOCKED',
        subtitle:
          'Champ is reserved for an upcoming scheduled order and is blocked from all new on-demand offers · released only after the scheduled drop is confirmed delivered',
        headerBg: '#f0f9ff',
        titleColor: '#0369a1',
        dotColor: '#0284c7',
        badge: '🔒 Locked — on-demand blocked',
        badgeClassName: 'bg-[#e0f2fe] text-[#0369a1]',
        callout: {
          tone: 'blue',
          label: 'Lock is time-triggered · release is event-driven',
          body: 'The pre-lock fires automatically at a configurable window before order.assigned_timeslot.pickup_at. The Champ cannot receive any new on-demand offers from that moment. However, the lock releases only when the scheduled order is marked delivered and confirmed — not when the delivery window opens, not at a fixed time. If the order is cancelled during the lock window, the Champ immediately returns to AVAILABLE for on-demand.',
        },
        timeline: [
          {
            id: 'before',
            title: 'Before Lock Window',
            body: 'Champ is AVAILABLE or ON_ORDER normally. Scheduled order is assigned and accepted. Champ continues receiving on-demand offers up until the lock fires.',
            pill: { text: '● AVAILABLE / ON_ORDER', className: 'bg-[#dcfce7] text-[#15803d]' },
            bg: 'bg-[#f9fafb]',
            titleClass: 'text-[#6b7280]',
          },
          {
            id: 'fires',
            title: 'Lock fires (pickup_at − X min)',
            body: 'System flips status to SCHEDULED_LOCKED. Gate 1 now blocks all new on-demand offers. Any on-demand order currently in acceptance queue for this Champ is withdrawn and re-offered to next scorer. Champ is not notified — this is invisible to them.',
            pill: { text: '🔒 SCHEDULED_LOCKED', className: 'bg-[#e0f2fe] text-[#0369a1]' },
            bg: 'bg-[#e0f2fe]',
            titleClass: 'text-[#0369a1]',
          },
          {
            id: 'exec',
            title: 'Scheduled execution window',
            body: 'Champ goes to vendor, picks up, delivers to customer. Status remains SCHEDULED_LOCKED throughout. Finishes any active on-demand orders that were already in progress before the lock fired — those are not interrupted.',
            pill: { text: '🔒 SCHEDULED_LOCKED', className: 'bg-[#e0f2fe] text-[#0369a1]' },
            bg: 'bg-[#e0f2fe]',
            titleClass: 'text-[#0369a1]',
          },
          {
            id: 'release',
            title: 'Delivery confirmed → released',
            body: 'Customer confirms receipt or system marks delivered. Status auto-flips to AVAILABLE. Champ immediately re-enters on-demand dispatch pool. No manual step required.',
            pill: { text: '● AVAILABLE', className: 'bg-[#dcfce7] text-[#15803d]' },
            bg: 'bg-[#f0fdf4]',
            titleClass: 'text-[#15803d]',
          },
        ],
        configTitle: 'Configurable lock parameters',
        configRows: [
          {
            id: 'prelock',
            label: 'Pre-lock window — fires before pickup_at',
            help: 'System calculates: lock_fires_at = order.assigned_timeslot.pickup_at − this value. Status flips to SCHEDULED_LOCKED at exactly that datetime.',
            control: 'preLockWindow',
            controlHint: 'before pickup_at',
          },
          {
            id: 'inprogress',
            label: 'Active on-demand orders at lock time — behaviour',
            help: 'Orders that were already accepted and in progress before the lock fired are NOT cancelled or interrupted. The Champ completes them. The lock only blocks new offers from arriving after the lock fires.',
            pill: { tone: 'on', text: 'In-progress orders continue' },
          },
          {
            id: 'queue',
            label: 'On-demand offers in acceptance queue at lock time',
            help: 'If an offer was pushed to this Champ but not yet accepted at the moment the lock fires, it is immediately withdrawn and re-scored against the next eligible Champ. The withdrawn offer does not count as a rejection against the Champ\'s acceptance rate in CPI.',
            pill: { tone: 'warn', text: 'Withdrawn — not a rejection' },
          },
        ],
        cancelTitle: 'If the scheduled order is cancelled during the lock window',
        cancelRows: [
          {
            id: 'customer',
            label: 'Customer cancels after lock fires',
            help: 'Scheduled order cancelled by customer. Lock releases immediately. Champ flips to AVAILABLE. Re-enters on-demand pool. No hold time. CPI not impacted (cancellation was customer-initiated).',
            pill: { tone: 'on', text: 'Immediate release → AVAILABLE' },
          },
          {
            id: 'vendor',
            label: 'Vendor cancels or goes offline after lock fires',
            help: 'Vendor-side cancellation. Lock releases immediately. Champ flips to AVAILABLE. System records vendor-initiated cancel against VPI. Customer receives full refund automatically.',
            pill: { tone: 'on', text: 'Immediate release → AVAILABLE' },
          },
          {
            id: 'system',
            label: 'System cancels (e.g. payment timeout on scheduled order)',
            help: 'Lock releases immediately. Champ returns to AVAILABLE. System cancel events are logged but do not impact Champ CPI.',
            pill: { tone: 'on', text: 'Immediate release → AVAILABLE' },
          },
        ],
        edgeTitle: 'Edge case — Champ has two scheduled orders in sequence',
        edgeRows: [
          {
            id: 'chain',
            label: 'Back-to-back scheduled orders (Order A then Order B)',
            help: 'Lock for Order A fires normally. When Order A is delivered, system checks: does Order B lock_fires_at fall before now? If yes → status stays SCHEDULED_LOCKED immediately for Order B with no AVAILABLE gap. If no → brief AVAILABLE window until Order B lock fires. The system evaluates this at Order A delivery confirmation, not at a fixed time.',
            pill: { tone: 'warn', text: 'Chain evaluation at delivery confirm' },
          },
        ],
        gateTitle: 'Gate 1 behaviour · Live Dashboard · CPI',
        gateRows: [
          {
            id: 'gate1',
            label: 'Dispatch engine — Gate 1',
            pill: {
              text: 'Excluded — Gate 1 fail · no on-demand offers',
              className: 'bg-[#fee2e2] text-[#991b1b]',
            },
          },
          {
            id: 'dash',
            label: 'Live Dashboard indicator',
            pill: {
              text: '🔒 Scheduled — locked',
              className: 'bg-[#e0f2fe] text-[#0369a1]',
            },
          },
          {
            id: 'cpi',
            label: 'CPI impact',
            help: 'Lock period counts as productive time — it does not reduce online hours for CPI purposes. The Champ is working, just not on on-demand. Acceptance rate is not affected by withdrawn offers during lock.',
            pill: { tone: 'on', text: 'No CPI penalty' },
          },
        ],
        schemaTitle: 'Schema fields',
        schemaRows: [
          {
            id: 'status',
            label: 'Status value',
            code: "champ.status = 'SCHEDULED_LOCKED'",
          },
          {
            id: 'lock-at',
            label: 'Lock trigger time (computed, stored)',
            code: 'champ.scheduled_lock_at = order.pickup_at − pre_lock_window',
          },
          {
            id: 'order',
            label: 'Locked order reference',
            code: 'champ.locked_order_id = order.id',
          },
          {
            id: 'release',
            label: 'Release trigger (event, not time)',
            code: 'order.status = DELIVERED → system sets champ.status = AVAILABLE',
          },
          {
            id: 'job',
            label: 'Job scheduler requirement',
            code: 'Cron or queue job: evaluate champ.scheduled_lock_at every minute → flip if due',
          },
        ],
      },
    },
    stateMachine: {
      title: 'State machine — valid transitions only',
      subtitle: 'The system must enforce these transitions — reject any transition not in this list',
      columns: ['From', 'To', 'Trigger', 'Who / What', 'Automation fires'],
      rows: [
        {
          from: 'OFFLINE',
          to: 'AVAILABLE',
          toColor: '#15803d',
          trigger: 'Champ taps Go Online',
          who: 'Champ app',
          fires: 'Enters dispatch pool',
        },
        {
          from: 'AVAILABLE',
          to: 'ON_ORDER',
          toColor: '#2563eb',
          trigger: 'Champ accepts offer',
          who: 'System',
          fires: 'active_orders++, load factor applied',
        },
        {
          from: 'ON_ORDER',
          to: 'AVAILABLE',
          toColor: '#15803d',
          trigger: 'Last order delivered',
          who: 'System',
          fires: 'active_orders=0, re-enters pool',
        },
        {
          from: 'ON_ORDER',
          to: 'ON_ORDER',
          toColor: '#2563eb',
          trigger: 'Stack offer accepted',
          who: 'System',
          fires: 'active_orders++, re-scores',
        },
        {
          from: 'AVAILABLE',
          to: 'ON_BREAK',
          toColor: '#111827',
          trigger: 'Champ taps Break (active_orders=0)',
          who: 'Champ app',
          fires: 'Removed from pool, break timer starts',
        },
        {
          from: 'ON_BREAK',
          to: 'AVAILABLE',
          toColor: '#15803d',
          trigger: 'Champ taps Resume',
          who: 'Champ app',
          fires: 'Re-enters pool',
        },
        {
          from: 'AVAILABLE',
          to: 'OFFLINE',
          toColor: '#6b7280',
          trigger: 'Champ taps Go Offline or app closes',
          who: 'Champ app / System',
          fires: 'Removed from pool',
        },
        {
          from: 'ON_ORDER',
          to: 'OFFLINE',
          toColor: '#6b7280',
          trigger: 'GPS lost > 5min',
          who: 'System',
          fires: 'Ops alert fires — dispatcher assesses',
        },
        {
          from: 'ON_ORDER',
          to: 'INCIDENT',
          toColor: '#c2410c',
          trigger: 'Champ reports incident',
          who: 'Champ app / Dispatcher',
          fires: 'Ops alert · customer notified · dispatcher reassigns',
        },
        {
          from: 'AVAILABLE',
          to: 'SUSPENDED',
          toColor: '#b91c1c',
          trigger: 'Admin suspends',
          who: 'Admin / Dispatcher',
          fires: 'Removed from pool · reason logged',
        },
        {
          from: 'ON_ORDER',
          to: 'SUSPENDED',
          toColor: '#b91c1c',
          trigger: 'Admin suspends',
          who: 'Admin / Dispatcher',
          fires: 'Ops alert · reassignment flow triggered',
        },
        {
          from: 'INCIDENT',
          to: 'SUSPENDED',
          toColor: '#b91c1c',
          trigger: 'Incident review complete',
          who: 'Admin',
          fires: 'Suspension reason recorded',
        },
        {
          from: 'SUSPENDED',
          to: 'AVAILABLE',
          toColor: '#15803d',
          trigger: 'Auto-lift (temp) or Admin lift (perm)',
          who: 'System / Admin',
          fires: 'Re-enters pool · Champ push notification',
        },
        {
          from: 'AVAILABLE or ON_ORDER',
          to: 'SCHEDULED_LOCKED',
          toColor: '#0369a1',
          trigger: 'lock_fires_at reached (pickup_at − pre-lock window)',
          who: 'System — scheduled job',
          fires:
            'Gate 1 blocks on-demand offers · in-progress on-demand continues · queued offers withdrawn (not a rejection)',
        },
        {
          from: 'SCHEDULED_LOCKED',
          to: 'AVAILABLE',
          toColor: '#15803d',
          trigger: 'Scheduled order delivered + confirmed',
          who: 'System — event-driven',
          fires: 'Re-enters on-demand pool immediately',
        },
        {
          from: 'SCHEDULED_LOCKED',
          to: 'AVAILABLE',
          toColor: '#15803d',
          trigger: 'Scheduled order cancelled (any reason)',
          who: 'System — event-driven',
          fires: 'Immediate release · no hold time',
        },
        {
          from: 'SCHEDULED_LOCKED',
          to: 'SCHEDULED_LOCKED',
          toColor: '#0369a1',
          trigger: 'Order A delivered · Order B lock already due',
          who: 'System — chain evaluation',
          fires: 'Stays locked · locked_order_id updates to Order B',
        },
        {
          from: 'AVAILABLE',
          to: 'FLEET_OCCUPIED',
          toColor: '#6d28d9',
          trigger: 'Fleet shift starts (Phase 2)',
          who: 'System',
          fires: 'Hard-locked to Fleet route',
        },
        {
          from: 'FLEET_OCCUPIED',
          to: 'AVAILABLE',
          toColor: '#15803d',
          trigger: 'Fleet route completed (Phase 2)',
          who: 'System',
          fires: 'Re-enters consumer pool',
        },
      ],
      footnote:
        'Any transition not listed above must be rejected by the backend with a 400 error and logged. The Champ app must never be able to set status = SUSPENDED or status = FLEET_OCCUPIED. Admin panel must not allow setting status = ON_ORDER manually — that is system-only.',
    },
    gate1: {
      title: 'Gate 1 — status check order (dispatch engine)',
      subtitle: 'Evaluated in this exact sequence · first fail = excluded · no further evaluation',
      // Ordered by circled priority numbers from the reference (①–⑥ then pass).
      // HTML mock column DOM order places ⑤ before ④; numbered sequence is used here.
      steps: [
        {
          n: '①',
          title: 'FLEET_OCCUPIED?',
          body: 'Hard excluded first. Phase 2 field.',
          bg: 'bg-[#faf5ff]',
          color: 'text-[#6d28d9]',
        },
        {
          n: '②',
          title: 'SUSPENDED?',
          body: 'Excluded. Admin decision.',
          bg: 'bg-[#fef2f2]',
          color: 'text-[#dc2626]',
        },
        {
          n: '③',
          title: 'INCIDENT?',
          body: 'Excluded. Physical emergency.',
          bg: 'bg-[#fff7ed]',
          color: 'text-[#c2410c]',
        },
        {
          n: '④',
          title: 'SCHEDULED_LOCKED?',
          body: 'Excluded from on-demand. Reserved for scheduled drop.',
          bg: 'bg-[#e0f2fe]',
          color: 'text-[#0284c7]',
        },
        {
          n: '⑤',
          title: 'OFFLINE / ON_BREAK?',
          body: 'Excluded. Not active.',
          bg: 'bg-[#fafafa]',
          color: 'text-[#6b7280]',
        },
        {
          n: '⑥',
          title: 'AT ORDER CAP?',
          body: 'ON_ORDER + active_orders ≥ cap → excluded.',
          bg: 'bg-[#eff6ff]',
          color: 'text-[#2563eb]',
        },
        {
          n: '✓',
          title: 'PASSES GATE 1',
          body: 'AVAILABLE or ON_ORDER under cap → enters Gate 2 scoring.',
          bg: 'bg-[#f0fdf4]',
          color: 'text-[#15803d]',
        },
      ],
    },
    editable: createChampStatusEditableDefaults(),
  }
}

export function cloneChampStatusEditable(editable) {
  return JSON.parse(JSON.stringify(editable || createChampStatusEditableDefaults()))
}

function durationTotalSeconds(duration) {
  if (!duration) return NaN
  const h = Number.parseInt(duration.h, 10)
  const m = Number.parseInt(duration.m, 10)
  const s = Number.parseInt(duration.s ?? '0', 10)
  if ([h, m, s].some((n) => Number.isNaN(n) || n < 0)) return NaN
  return h * 3600 + m * 60 + s
}

/** Local UI validation only — no business side effects. */
export function validateChampStatus(editable) {
  const checks = [
    ['Break reminder timer', editable?.breakReminder],
    ['GPS → OFFLINE timeout', editable?.gpsOfflineTimeout],
    ['Reassignment deadline', editable?.reassignmentDeadline],
    ['Pre-lock window', editable?.preLockWindow],
  ]

  for (const [label, duration] of checks) {
    const total = durationTotalSeconds(duration)
    if (Number.isNaN(total)) {
      return `${label} must use valid non-negative time values.`
    }
    if (total <= 0) {
      return `${label} must be greater than zero.`
    }
  }

  return null
}
