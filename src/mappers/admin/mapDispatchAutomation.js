/**
 * Dispatch Automation Admin mappers (P2B).
 *
 * CRITICAL: PATCH must send a FULL config cloned from the latest backend draft.
 * Backend normalizeDispatchConfig merges against DEFAULT_DISPATCH_CONFIG, not
 * the existing stored draft — never send a partial subsection alone.
 */

export const SIMULATE_MAX_LIMIT = 100

export function deepCloneConfig(config) {
  if (config == null || typeof config !== 'object') return {}
  return structuredClone(config)
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function parsePositiveNumber(raw, fallback = null) {
  if (raw === '' || raw == null) return fallback
  const n = typeof raw === 'number' ? raw : Number.parseFloat(String(raw))
  if (!Number.isFinite(n) || n < 0) return fallback
  return n
}

function parseIntSec(raw, fallback = null) {
  const n = parsePositiveNumber(raw, fallback)
  if (n == null) return fallback
  return Math.round(n)
}

/** Duration UI { h, m, s } → total seconds */
export function durationToSeconds(duration) {
  if (!duration || typeof duration !== 'object') return null
  const h = Number.parseInt(duration.h, 10) || 0
  const m = Number.parseInt(duration.m, 10) || 0
  const s = Number.parseInt(duration.s, 10) || 0
  return Math.max(0, h * 3600 + m * 60 + s)
}

/** Total seconds → duration UI { operator, h, m, s } */
export function secondsToDuration(totalSec, operator = '≤') {
  const sec = Math.max(0, Math.floor(Number(totalSec) || 0))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
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

/**
 * Force stacking.liveEnabled = false (P2 absolute rule).
 * Preserves all other stacking / config keys.
 */
export function forceLiveEnabledFalse(config) {
  const next = deepCloneConfig(config)
  const stacking = asRecord(next.stacking)
  next.stacking = { ...stacking, liveEnabled: false }
  return next
}

/**
 * Strip fields that must never be mutated from Automation UI in P2B.
 * Weights stay as server literals; POD bonus / SLA timers / radius timers
 * are not written from FE edits (edits never applied in apply* functions).
 */
export function stripForbiddenMutations(config) {
  return forceLiveEnabledFalse(config)
}

// ---------------------------------------------------------------------------
// Dispatch Rules UI ↔ config
// ---------------------------------------------------------------------------

/**
 * Map backend draftConfig → Dispatch Rules editable subset.
 * Gate1 "broadcastRadiusKm" UI field = stagesKm[0] (Stage 1), NOT broadcastRadiusKm.
 *
 * @param {object} config
 * @param {{ onTimeThresholdSec?: number, finalDeadlineSec?: number } | null} [effectiveAcceptance]
 *   Backend-resolved hot-food timing. When null/incomplete in real mode, SLA fields stay null
 *   (never invent 60/120).
 */
export function mapConfigToDispatchRulesEditable(config, effectiveAcceptance = null) {
  const radius = asRecord(config?.radius)
  const stages = Array.isArray(radius.stagesKm) ? radius.stagesKm : [5, 8, 12]
  const eligibility = asRecord(config?.eligibility)
  const caps = asRecord(eligibility.maxActiveOrdersByVehicle)
  const carCap = caps.CAR ?? caps.car ?? 3

  const onTime = Number(effectiveAcceptance?.onTimeThresholdSec)
  const deadline = Number(effectiveAcceptance?.finalDeadlineSec)

  return {
    broadcastRadiusKm: createOperatorNumber('≤', stages[0] ?? 5),
    activeOrderCap: createOperatorNumber('≤', carCap),
    // SLA-owned — present for UI shape only; never PATCH-mutated from Automation
    slaTarget: Number.isFinite(onTime) ? secondsToDuration(onTime, '≤') : null,
    criticalThreshold: Number.isFinite(deadline) ? secondsToDuration(deadline, '≥') : null,
  }
}

/**
 * Pick hot-food effective timing from SLA model DTO (backend-resolved).
 * Does not interpret raw tiers in the frontend.
 */
export function pickHotFoodEffectiveAcceptance(effectiveVendorAcceptance) {
  const root = asRecord(effectiveVendorAcceptance)
  const modes = asRecord(root.modes)
  const hot = asRecord(modes.hotFoodOnDemand || root.hotFoodOnDemand)
  const onTime = Number(hot.onTimeThresholdSec)
  const deadline = Number(hot.finalDeadlineSec)
  if (!Number.isFinite(onTime) || !Number.isFinite(deadline)) return null
  return {
    modelId: root.modelId ?? null,
    modelVersion: root.modelVersion ?? null,
    isDefault: root.isDefault ?? null,
    mapping: hot.mapping ?? null,
    slaKey: hot.slaKey || 'hotFoodOnDemand',
    orderType: hot.orderType || 'DELIVERY',
    acceptanceTimeSec: asRecord(hot.acceptanceTimeSec),
    onTimeThresholdSec: Math.floor(onTime),
    finalDeadlineSec: Math.floor(deadline),
  }
}

/** Build AcceptanceTimeline stages from backend effective seconds (display only). */
export function buildVendorAcceptanceTimelineFromEffective(effective) {
  if (!effective) return null
  const on = effective.onTimeThresholdSec
  const dead = effective.finalDeadlineSec
  const lateStart = on + 1
  const lateEnd = Math.max(on, dead - 1)
  const lateLabel =
    dead > on + 1 ? `${lateStart}–${lateEnd}s` : dead > on ? `${lateStart}s` : `${on}s`

  return [
    {
      id: 'normal',
      time: `0–${on}s`,
      title: 'Normal Window',
      body: 'Vendor accepts → order continues. SLA met. No flags.',
      badge: '● On Track',
      tone: 'green',
    },
    {
      id: 'breach',
      time: `${on}s`,
      title: 'At Risk Breach',
      body: 'On-time threshold crossed. Order may flip to At Risk. Vendor can still accept until the final deadline.',
      badge: '⚠ At Risk',
      tone: 'yellow',
    },
    {
      id: 'window',
      time: lateLabel,
      title: 'At Risk Window',
      body: 'Accept still allowed until the final acceptance deadline. No dispatcher intervention in normal flow.',
      badge: '⚠ At Risk',
      tone: 'orange',
    },
    {
      id: 'critical',
      time: `${dead}s`,
      title: 'Critical — Auto-Cancel',
      body: 'Unresolved acceptance at the final deadline → system timeout path. Customer notified via existing lifecycle.',
      badge: '✗ Critical → Cancelled',
      tone: 'red',
    },
  ]
}

export function formatVendorAcceptanceEffectiveSummary(effective) {
  if (!effective) return null
  const on = effective.onTimeThresholdSec
  const dead = effective.finalDeadlineSec
  return `0–${on}s On Track · At Risk after ${on}s · accept allowed until ${dead}s · ${dead}s auto-cancel`
}

/**
 * Apply Dispatch Rules supported edits onto a FULL server config clone.
 * Does NOT mutate: slaTarget, criticalThreshold, scoring weights, radius timers.
 */
export function applyDispatchRulesEdits(fullServerConfig, editable) {
  const next = deepCloneConfig(fullServerConfig)
  next.radius = { ...asRecord(next.radius) }
  const stages = Array.isArray(next.radius.stagesKm)
    ? [...next.radius.stagesKm]
    : [5, 8, 12]
  const stage1 = parsePositiveNumber(editable?.broadcastRadiusKm?.value, stages[0])
  if (stage1 != null) stages[0] = stage1
  next.radius.stagesKm = stages

  next.eligibility = { ...asRecord(next.eligibility) }
  next.eligibility.maxActiveOrdersByVehicle = {
    ...asRecord(next.eligibility.maxActiveOrdersByVehicle),
  }
  const cap = parseIntSec(editable?.activeOrderCap?.value, null)
  if (cap != null) {
    next.eligibility.maxActiveOrdersByVehicle.CAR = cap
  }

  return stripForbiddenMutations(next)
}

// ---------------------------------------------------------------------------
// Stacking UI ↔ config
// ---------------------------------------------------------------------------

export function mapConfigToStackingEditable(config) {
  const stacking = asRecord(config?.stacking)
  const t1 = asRecord(stacking.trigger1)
  const t2 = asRecord(stacking.trigger2)
  const t3 = asRecord(stacking.trigger3)
  const reevaluateStage = Number(t2.reevaluateFromRadiusStage)
  return {
    dropZoneRadiusKm: createOperatorNumber('≤', t1.maxPairwiseDropKm ?? 2),
    longDistanceThresholdKm: createOperatorNumber('≥', t2.longDistanceKm ?? 10),
    holdWindow: secondsToDuration(t2.holdWindowSec ?? 90, '≤'),
    reevaluateAtStage3: Number.isFinite(reevaluateStage) ? reevaluateStage <= 2 : true,
    interVendorPickupRadiusKm: createOperatorNumber('≤', t3.maxPairwisePickupKm ?? 4),
    trigger3Enabled: t3.enabled !== false,
  }
}

export function applyStackingEdits(fullServerConfig, editable) {
  const next = deepCloneConfig(fullServerConfig)
  next.stacking = { ...asRecord(next.stacking) }
  next.stacking.trigger1 = { ...asRecord(next.stacking.trigger1) }
  next.stacking.trigger2 = { ...asRecord(next.stacking.trigger2) }
  next.stacking.trigger3 = { ...asRecord(next.stacking.trigger3) }

  const dropKm = parsePositiveNumber(editable?.dropZoneRadiusKm?.value, null)
  if (dropKm != null) next.stacking.trigger1.maxPairwiseDropKm = dropKm

  const longKm = parsePositiveNumber(editable?.longDistanceThresholdKm?.value, null)
  if (longKm != null) next.stacking.trigger2.longDistanceKm = longKm

  const holdSec = durationToSeconds(editable?.holdWindow)
  if (holdSec != null) next.stacking.trigger2.holdWindowSec = holdSec

  // Stage 3+ re-eval: FE bool → backend stage index (0-based). Stage 3 ≈ index 2.
  if (typeof editable?.reevaluateAtStage3 === 'boolean') {
    next.stacking.trigger2.reevaluateFromRadiusStage = editable.reevaluateAtStage3 ? 2 : 99
  }

  const pickupKm = parsePositiveNumber(editable?.interVendorPickupRadiusKm?.value, null)
  if (pickupKm != null) next.stacking.trigger3.maxPairwisePickupKm = pickupKm

  if (typeof editable?.trigger3Enabled === 'boolean') {
    next.stacking.trigger3.enabled = editable.trigger3Enabled
  }

  // ABSOLUTE: never enable live stacking from Automation UI
  next.stacking.liveEnabled = false
  next.stacking.bikeStackingEnabled = false

  return stripForbiddenMutations(next)
}

// ---------------------------------------------------------------------------
// Radius UI ↔ config (stages only — timers excluded)
// ---------------------------------------------------------------------------

export function mapConfigToRadiusEditable(config) {
  const radius = asRecord(config?.radius)
  const stages = Array.isArray(radius.stagesKm) ? radius.stagesKm : [5, 8, 12]
  return {
    stage1RadiusKm: createOperatorNumber('≤', stages[0] ?? 5),
    stage2RadiusKm: createOperatorNumber('≤', stages[1] ?? 8),
    stage3RadiusKm: createOperatorNumber('≤', stages[2] ?? 12),
    // Timers: reference-only in P2B — seeded for display, never PATCHed
    hotFoodOffer: secondsToDuration(45, '≤'),
    otherOnDemandOffer: secondsToDuration(90, '≤'),
    stage2To3: secondsToDuration(120, '≤'),
    stage3To4: secondsToDuration(180, '≤'),
    overallAutoCancel: secondsToDuration(900, '≥'),
  }
}

/**
 * Apply Stage 1–3 radii only. Preserves broadcastRadiusKm, expansionDelaySec,
 * and any other radius keys. Never writes timer fields into expansionDelaySec.
 */
export function applyRadiusEdits(fullServerConfig, editable) {
  const next = deepCloneConfig(fullServerConfig)
  next.radius = { ...asRecord(next.radius) }
  const stages = Array.isArray(next.radius.stagesKm)
    ? [...next.radius.stagesKm]
    : [5, 8, 12]

  const s1 = parsePositiveNumber(editable?.stage1RadiusKm?.value, stages[0])
  const s2 = parsePositiveNumber(editable?.stage2RadiusKm?.value, stages[1])
  const s3 = parsePositiveNumber(editable?.stage3RadiusKm?.value, stages[2])
  if (s1 != null) stages[0] = s1
  if (s2 != null) stages[1] = s2
  if (s3 != null) stages[2] = s3
  next.radius.stagesKm = stages

  // Explicitly do NOT touch expansionDelaySec / offer timers / noChampCancelSec
  return stripForbiddenMutations(next)
}

export function validateRadiusStageOrder(editable) {
  const s1 = Number.parseFloat(editable?.stage1RadiusKm?.value)
  const s2 = Number.parseFloat(editable?.stage2RadiusKm?.value)
  const s3 = Number.parseFloat(editable?.stage3RadiusKm?.value)
  if (![s1, s2, s3].every((n) => Number.isFinite(n) && n >= 0)) {
    return 'Stage radii must be valid non-negative numbers with Stage 1 < Stage 2 < Stage 3.'
  }
  if (!(s1 < s2 && s2 < s3)) {
    return `Invalid radius sequence: Stage 1 (${s1} km) < Stage 2 (${s2} km) < Stage 3 (${s3} km) is required.`
  }
  return null
}

// ---------------------------------------------------------------------------
// Scoring (read-only weights — no mutation helpers that change weights)
// ---------------------------------------------------------------------------

export function mapConfigToScoringDisplay(config) {
  const scoring = asRecord(config?.scoring)
  return {
    etaWeight: scoring.etaWeight ?? 40,
    cpiWeight: scoring.cpiWeight ?? 30,
    activeLoadWeight: scoring.activeLoadWeight ?? 20,
    categoryFitWeight: scoring.categoryFitWeight ?? 10,
  }
}

/**
 * Scoring tab Save Changes: no weight / POD mutations.
 * Returns full config with liveEnabled forced false only.
 */
export function applyScoringEdits(fullServerConfig) {
  return stripForbiddenMutations(deepCloneConfig(fullServerConfig))
}

// ---------------------------------------------------------------------------
// Overview KPIs
// ---------------------------------------------------------------------------

export function formatDispatchSeconds(sec) {
  if (sec == null || !Number.isFinite(Number(sec))) return null
  const total = Math.max(0, Math.round(Number(sec)))
  const m = Math.floor(total / 60)
  const s = total % 60
  if (m <= 0) return `${s}s`
  return `${m}m ${String(s).padStart(2, '0')}s`
}

/**
 * Map overview API → Dispatch Rules KPI cards.
 * Returns null value when semantic data is unavailable (real mode must not fabricate).
 */
export function mapOverviewToKpis(overview, options = {}) {
  const kpis = asRecord(overview?.kpis)
  const champs = asRecord(kpis.activeChamps)
  const escalation = asRecord(kpis.ordersInEscalation)
  const byStage = asRecord(escalation.byRadiusStageKm)

  const stageParts = Object.entries(byStage)
    .filter(([, count]) => Number(count) > 0)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([km, count]) => `${count} × ${km} km`)

  const avgSec = kpis.avgDispatchTimeSec
  const rate = kpis.vendorOnTimeAcceptanceRatePct
  const onTimeSec = Number(options.onTimeThresholdSec)
  const hasOnTime = Number.isFinite(onTimeSec)
  const acceptanceLabel = hasOnTime
    ? `Vendor ${Math.floor(onTimeSec)}s acceptance rate`
    : 'Vendor on-time acceptance rate'
  const acceptanceDelta =
    rate == null
      ? 'No acceptance outcomes today'
      : hasOnTime
        ? `ON_TIME outcomes (${Math.floor(onTimeSec)}s classification)`
        : 'ON_TIME outcomes (SLA-resolved threshold)'

  return [
    {
      id: 'avg-dispatch',
      value: formatDispatchSeconds(avgSec) ?? '—',
      label: 'Avg dispatch time today',
      delta:
        avgSec == null
          ? 'No samples today'
          : 'From dispatch start → Champ accept',
      deltaTone: avgSec == null ? 'muted' : 'up',
      accent: 'green',
      unavailable: avgSec == null,
    },
    {
      id: 'vendor-acceptance',
      value: rate == null ? '—' : `${rate}%`,
      label: acceptanceLabel,
      delta: acceptanceDelta,
      deltaTone: rate == null ? 'muted' : 'up',
      accent: 'amber',
      unavailable: rate == null,
    },
    {
      id: 'active-champs',
      value: String(champs.total ?? 0),
      label: 'Active Champs right now',
      delta: `${champs.occupied ?? 0} Occupied · ${champs.available ?? 0} Available`,
      deltaTone: 'muted',
      accent: 'green',
      unavailable: false,
    },
    {
      id: 'escalation',
      value: String(escalation.total ?? 0),
      label: 'Orders in escalation',
      delta: stageParts.length ? stageParts.join(' · ') : 'No searching orders',
      deltaTone: (escalation.total ?? 0) > 0 ? 'down' : 'muted',
      accent: 'red',
      unavailable: false,
    },
  ]
}

export function mapRuleSetMeta(rule) {
  if (!rule) return null
  return {
    id: rule.id,
    name: rule.name,
    status: rule.status,
    version: rule.version,
    updatedAt: rule.updatedAt,
    activatedAt: rule.activatedAt,
  }
}

/** Prefer ACTIVE, else first DRAFT/TEST/PAUSED by updatedAt desc (list already ordered). */
export function pickWorkingRuleSet(list) {
  const rows = Array.isArray(list) ? list : []
  const active = rows.find((r) => r.status === 'ACTIVE')
  if (active) return active
  return rows[0] ?? null
}

export function getEditableConfig(rule) {
  if (!rule) return {}
  if (rule.draftConfig != null && typeof rule.draftConfig === 'object') {
    return deepCloneConfig(rule.draftConfig)
  }
  return deepCloneConfig(rule.config)
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

function formatClock(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-GB', { hour12: false })
}

function formatStamp(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', { hour12: false })
}

function acceptanceStatus(outcome) {
  switch (outcome) {
    case 'ON_TIME':
      return { statusLabel: '✓ On time', statusTone: 'onTime' }
    case 'LATE':
      return { statusLabel: '⚠ Late', statusTone: 'late' }
    case 'DISPATCHER_RESOLVED':
      return { statusLabel: '⚠ Late · dispatcher resolved', statusTone: 'late' }
    case 'NO_RESPONSE':
      return { statusLabel: '✗ No response · cancelled', statusTone: 'none' }
    case 'PENDING':
      return { statusLabel: 'Pending', statusTone: 'late' }
    default:
      return { statusLabel: outcome || '—', statusTone: 'late' }
  }
}

function fulfillmentLabel(row) {
  if (row.fulfillmentType === 'SCHEDULED') {
    return row.deliverySpeed
      ? String(row.deliverySpeed)
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Scheduled'
  }
  return 'On-demand'
}

export function mapAuditLogResponse(log, catalogShell) {
  const vendorRows = (log?.vendorAcceptance ?? []).map((row) => {
    const status = acceptanceStatus(row.outcome)
    const elapsed =
      row.elapsedSeconds == null
        ? '—'
        : row.acceptedAt
          ? `${row.elapsedSeconds}s`
          : `${row.elapsedSeconds}s+`
    return {
      id: row.id,
      order: row.orderNumber || row.orderId,
      vendor: row.vendorName || '—',
      type: fulfillmentLabel(row),
      placedAt: formatClock(row.orderPlacedAt),
      acceptedAt: row.acceptedAt ? formatClock(row.acceptedAt) : '—',
      elapsed,
      ...status,
    }
  })

  const ruleRows = (log?.ruleChanges ?? []).map((row) => {
    const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {}
    return {
      id: row.id,
      timestamp: formatStamp(row.at),
      module: 'Dispatch Rules',
      fieldChanged: row.action || '—',
      changedBy: row.actorName || '—',
      from: meta.from != null ? String(meta.from) : '—',
      to: meta.to != null ? String(meta.to) : meta.version != null ? `v${meta.version}` : '—',
      reason: meta.note || meta.reason || row.target || '—',
    }
  })

  return {
    header: catalogShell?.header ?? {
      title: 'Audit Log',
      subtitle: 'All automation rule changes · permanent · non-deletable',
    },
    metadata: { permanent: true, deletable: false },
    exportFilename: catalogShell?.exportFilename ?? 'yjeek-automation-audit-log.csv',
    vendorAcceptance: {
      title: catalogShell?.vendorAcceptance?.title ?? 'Vendor acceptance log',
      columns: catalogShell?.vendorAcceptance?.columns ?? [
        'Order',
        'Vendor',
        'Type',
        'Placed at',
        'Accepted at',
        'Elapsed',
        'Status',
      ],
      rows: vendorRows,
    },
    ruleChanges: {
      title: catalogShell?.ruleChanges?.title ?? 'Rule change audit log',
      columns: catalogShell?.ruleChanges?.columns ?? [
        'Timestamp',
        'Module',
        'Field changed',
        'Changed by',
        'From',
        'To',
        'Reason',
      ],
      rows: ruleRows,
    },
    from: log?.from,
    to: log?.to,
  }
}

/**
 * Assert unknown top-level and nested keys survive a round-trip edit apply.
 * Used by tests.
 */
export function assertUnknownKeysPreserved(before, after, paths = []) {
  for (const path of paths) {
    const parts = path.split('.')
    let b = before
    let a = after
    for (const p of parts) {
      b = b?.[p]
      a = a?.[p]
    }
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      throw new Error(`Key path ${path} was not preserved`)
    }
  }
}
