/** Frontend mock source for Automation → Dispatch Rules.
 * Later backend integration can replace `getDispatchRulesMock()` without rewriting the screen.
 */

export function createDuration(operator, h, m, s) {
  return {
    operator,
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  }
}

export function createOperatorNumber(operator, value) {
  return { operator, value: String(value) }
}

/** Editable config snapshot used by Reset / Save (local only). */
export function createDispatchRulesEditableDefaults() {
  return {
    broadcastRadiusKm: createOperatorNumber('≤', 5),
    activeOrderCap: createOperatorNumber('≤', 3),
    slaTarget: createDuration('≤', 0, 1, 0),
    criticalThreshold: createDuration('≥', 0, 2, 0),
  }
}

export function getDispatchRulesMock() {
  return {
    header: {
      title: 'Dispatch Rules',
      subtitle: 'Control how orders are automatically assigned to Champs',
    },
    kpis: [
      {
        id: 'avg-dispatch',
        value: '1m 42s',
        label: 'Avg dispatch time today',
        delta: '↓ 18s vs yesterday',
        deltaTone: 'up',
        accent: 'green',
      },
      {
        id: 'vendor-acceptance',
        value: '94.2%',
        label: 'Vendor 60s acceptance rate',
        delta: '↑ 2.1% this week',
        deltaTone: 'up',
        accent: 'amber',
      },
      {
        id: 'active-champs',
        value: '38',
        label: 'Active Champs right now',
        delta: '6 Occupied · 32 Available',
        deltaTone: 'muted',
        accent: 'green',
      },
      {
        id: 'escalation',
        value: '3',
        label: 'Orders in escalation',
        delta: '2 × Stage 2 · 1 × Stage 3',
        deltaTone: 'down',
        accent: 'red',
      },
    ],
    gate1: {
      title: 'Gate 1 — Eligibility Filter',
      subtitle: 'Hard exclusion — runs before scoring. Binary, no override at this layer.',
      status: 'Active',
      rows: [
        { id: 'champ-status', label: 'Champ status check', kind: 'enforced', value: 'Enforced' },
        {
          id: 'broadcast-radius',
          label: 'Broadcast radius — Stage 1',
          kind: 'number',
          fieldKey: 'broadcastRadiusKm',
          unit: 'km',
        },
        { id: 'category-allowlist', label: 'Category allowlist check', kind: 'enforced', value: 'Enforced' },
        {
          id: 'pod-conditions',
          label: 'Pay on Delivery conditions check',
          kind: 'enforced',
          value: 'Enforced',
        },
        {
          id: 'active-order-cap',
          label: 'Active order cap',
          kind: 'number',
          fieldKey: 'activeOrderCap',
          unit: 'orders',
        },
      ],
    },
    gate2: {
      title: 'Gate 2 — Vehicle Capability Match',
      subtitle: 'Matches order category and fragility flags to permitted vehicle types',
      status: 'Active',
      rows: [
        { id: 'standard', label: 'Standard orders', value: 'Bike + Car', tone: 'on' },
        {
          id: 'fragile',
          label: 'Fragile orders (flowers, glass, perfume)',
          value: 'Car only',
          tone: 'warn',
        },
        {
          id: 'large',
          label: 'Large / heavy orders',
          value: 'Cargo — Phase 2',
          tone: 'phase2',
          phase2: true,
        },
        {
          id: 'cold-chain',
          label: 'Cold-chain orders',
          value: 'Chiller / Freezer — Phase 2',
          tone: 'phase2',
          phase2: true,
        },
      ],
    },
    vendorAcceptance: {
      title: 'Vendor Acceptance — Fully Automated — On-Demand',
      subtitle:
        'Customer sees "Waiting for vendor to confirm" — no payment screen before acceptance · no dispatcher involvement in normal flow',
      status: 'Core rule — always on',
      callout: {
        label: 'Dispatcher does not intervene in the acceptance flow',
        body: 'The entire acceptance window is system-automated. The dispatcher sees order status in real time on the Live Dashboard (On Track → At Risk → Critical → Cancelled) but cannot and does not intervene. Dispatcher involvement is reserved for physical incidents only — vehicle breakdown, Champ injury, or other operational emergencies that the system cannot auto-resolve.',
      },
      timeline: [
        {
          id: 'normal',
          time: '0–60s',
          title: 'Normal Window',
          body: 'Vendor accepts → order continues. SLA met. No flags.',
          badge: '● On Track',
          tone: 'green',
        },
        {
          id: 'breach',
          time: '60s',
          title: 'At Risk Breach',
          body: 'SLA breach recorded. Order flag flips to At Risk on Live Dashboard. Breach timestamped. VPI component hit. Vendor can still accept.',
          badge: '⚠ At Risk',
          tone: 'yellow',
        },
        {
          id: 'window',
          time: '61–119s',
          title: 'At Risk Window',
          body: 'Every second beyond 60 is logged. Vendor can still accept during this window. No dispatcher action. Order card stays amber.',
          badge: '⚠ At Risk',
          tone: 'orange',
        },
        {
          id: 'critical',
          time: '120s',
          title: 'Critical — Auto-Cancel',
          body: 'System auto-cancels from vendor. Customer notified + full refund auto-triggered. Champ released. All events timestamped. Feeds VPI.',
          badge: '✗ Critical → Cancelled',
          tone: 'red',
        },
      ],
      thresholds: [
        {
          id: 'sla-target',
          fieldKey: 'slaTarget',
          label: 'SLA target — on-time acceptance window',
          help: 'Vendor must accept within this window. Breach at this point records against VPI and flips order to At Risk on Live Dashboard.',
        },
        {
          id: 'critical-threshold',
          fieldKey: 'criticalThreshold',
          label: 'Critical threshold — auto-cancel fires',
          help: 'System auto-cancels order from vendor at this point. Customer receives full refund automatically. Champ released. No dispatcher action required.',
        },
      ],
      events: [
        {
          id: 'placed',
          label: 'order_id · vendor_id · order_placed_at',
          badge: 'Always recorded',
          tone: 'on',
        },
        {
          id: 'accepted',
          label: 'accepted_at · elapsed_seconds',
          badge: 'Always recorded',
          tone: 'on',
        },
        {
          id: 'breach',
          label: 'at_risk_breach_at (when 60s crossed)',
          badge: 'Recorded on breach',
          tone: 'warn',
        },
        {
          id: 'cancelled',
          label: 'cancelled_at · cancellation_reason = VENDOR_NO_RESPONSE',
          badge: 'Recorded on auto-cancel',
          tone: 'warn',
        },
        {
          id: 'refund',
          label: 'refund_triggered_at · refund_method = ORIGINAL_PAYMENT',
          badge: 'Recorded on auto-cancel',
          tone: 'warn',
        },
      ],
      vpi: {
        label: 'VPI component affected',
        help: 'Acceptance rate component in VPI. Feeds weekly score. Flag is derived — never manually editable. One source of truth.',
        badge: 'Acceptance Rate — VPA Article 7.2',
      },
      liveDashboard: {
        sectionTitle: 'Live Dashboard behaviour — worst-flag-wins on order card',
        flagsLabel: 'Order card flag — Live Dashboard',
        flags: [
          { id: 'on-track', label: '● On Track', tone: 'onTrack' },
          { id: 'at-risk', label: '⚠ At Risk', tone: 'atRisk' },
          { id: 'critical', label: '✗ Critical', tone: 'critical' },
        ],
        derivedLabel: 'Flags are derived from elapsed time — never manually set or overridden',
        derivedBadge: 'Read-only on Live Dashboard',
        dispatcherLabel: 'Dispatcher view on auto-cancel',
        dispatcherBadge: 'Sees order flip Critical → Cancelled · no action required',
      },
    },
    editable: createDispatchRulesEditableDefaults(),
  }
}

export function cloneDispatchRulesEditable(editable) {
  return structuredClone(editable)
}
