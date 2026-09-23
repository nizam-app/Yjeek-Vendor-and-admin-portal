/**
 * Dispatch Automation Admin mappers (P2B).
 *
 * CRITICAL: PATCH must send a FULL config cloned from the latest backend draft.
 * Backend normalizeDispatchConfig merges against DEFAULT_DISPATCH_CONFIG, not
 * the existing stored draft — never send a partial subsection alone.
 */

/** Buyer requirement: shadow-simulate last 500 historical orders. */
export const SIMULATE_MAX_LIMIT = 500

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
 * Strip fields that must never be mutated from Automation UI.
 * Always forces stacking.liveEnabled false.
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
  const maxCar = Number(stacking.maxCarOrders)
  const requiredFailed = Number(t3.requiredFailedOffers)
  return {
    dropZoneRadiusKm: createOperatorNumber('≤', t1.maxPairwiseDropKm ?? 2),
    companionDropKm: createOperatorNumber('≤', t2.companionDropKm ?? 2),
    longDistanceThresholdKm: createOperatorNumber('≥', t2.longDistanceKm ?? 10),
    holdWindow: secondsToDuration(t2.holdWindowSec ?? 90, '≤'),
    reevaluateAtStage3: Number.isFinite(reevaluateStage) ? reevaluateStage <= 2 : true,
    interVendorPickupRadiusKm: createOperatorNumber('≤', t3.maxPairwisePickupKm ?? 4),
    requiredFailedOffers: createOperatorNumber(
      '≥',
      Number.isFinite(requiredFailed) ? requiredFailed : 2,
    ),
    maxCarOrders: createOperatorNumber(
      '≤',
      Number.isFinite(maxCar) && maxCar >= 2 ? Math.min(3, Math.floor(maxCar)) : 3,
    ),
    trigger1Enabled: t1.enabled !== false,
    trigger2Enabled: t2.enabled !== false,
    trigger3Enabled: t3.enabled !== false,
  }
}

/**
 * Capacity matrix derived from DispatchRuleSet stacking + eligibility config.
 * Bike stacking stays off at launch; cargo remains Phase 2 display.
 */
export function mapConfigToStackingCapacityRows(config) {
  const stacking = asRecord(config?.stacking)
  const eligibility = asRecord(config?.eligibility)
  const byVehicle = asRecord(eligibility.maxActiveOrdersByVehicle)
  const maxCar = Number(stacking.maxCarOrders)
  const carCap =
    Number.isFinite(maxCar) && maxCar >= 2 ? Math.min(3, Math.floor(maxCar)) : 3
  const bikeCap = Number(byVehicle.BIKE)
  const bikeText = Number.isFinite(bikeCap) ? String(Math.floor(bikeCap)) : '2'
  const carYes = { kind: 'yes', text: `✓ up to ${carCap}` }

  return [
    {
      id: 'bike',
      vehicle: 'Bike',
      maxActiveOrders: { kind: 'value', text: bikeText },
      trigger1: { kind: 'pill', text: 'Off at launch', tone: 'off' },
      trigger2: { kind: 'no', text: '✗' },
      trigger3: { kind: 'no', text: '✗' },
    },
    {
      id: 'car',
      vehicle: 'Car',
      maxActiveOrders: { kind: 'value', text: String(carCap) },
      trigger1: carYes,
      trigger2: { ...carYes },
      trigger3: { ...carYes },
    },
    {
      id: 'cargo',
      vehicle: 'Cargo Van',
      maxActiveOrders: { kind: 'phase2', text: 'TBD Phase 2' },
      trigger1: { kind: 'phase2', text: 'Phase 2' },
      trigger2: { kind: 'phase2', text: 'Phase 2' },
      trigger3: { kind: 'phase2', text: 'Phase 2' },
      phase2: true,
    },
  ]
}

export function applyStackingEdits(fullServerConfig, editable) {
  const next = deepCloneConfig(fullServerConfig)
  next.stacking = { ...asRecord(next.stacking) }
  next.stacking.trigger1 = { ...asRecord(next.stacking.trigger1) }
  next.stacking.trigger2 = { ...asRecord(next.stacking.trigger2) }
  next.stacking.trigger3 = { ...asRecord(next.stacking.trigger3) }

  const dropKm = parsePositiveNumber(editable?.dropZoneRadiusKm?.value, null)
  if (dropKm != null) next.stacking.trigger1.maxPairwiseDropKm = dropKm

  const companionKm = parsePositiveNumber(editable?.companionDropKm?.value, null)
  if (companionKm != null) next.stacking.trigger2.companionDropKm = companionKm

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

  const failedOffers = parseIntSec(editable?.requiredFailedOffers?.value, null)
  if (failedOffers != null) {
    next.stacking.trigger3.requiredFailedOffers = Math.min(10, Math.max(2, failedOffers))
  }

  const maxCar = parseIntSec(editable?.maxCarOrders?.value, null)
  if (maxCar != null) {
    next.stacking.maxCarOrders = Math.min(3, Math.max(2, maxCar))
  }

  if (typeof editable?.trigger1Enabled === 'boolean') {
    next.stacking.trigger1.enabled = editable.trigger1Enabled
  }
  if (typeof editable?.trigger2Enabled === 'boolean') {
    next.stacking.trigger2.enabled = editable.trigger2Enabled
  }
  if (typeof editable?.trigger3Enabled === 'boolean') {
    next.stacking.trigger3.enabled = editable.trigger3Enabled
  }

  // ABSOLUTE: never enable live stacking from Automation UI
  next.stacking.liveEnabled = false
  next.stacking.bikeStackingEnabled = false

  return stripForbiddenMutations(next)
}

/**
 * Client-side clamps mirroring backend dispatch-config stacking zod bounds.
 * Returns an error string or null when valid.
 */
export function validateStackingEdits(editable) {
  const dropKm = Number.parseFloat(editable?.dropZoneRadiusKm?.value)
  if (Number.isFinite(dropKm) && (dropKm <= 0 || dropKm > 10)) {
    return 'Trigger 1 drop-zone radius must be between 0 and 10 km (exclusive of 0).'
  }

  const companionKm = Number.parseFloat(editable?.companionDropKm?.value)
  if (Number.isFinite(companionKm) && (companionKm <= 0 || companionKm > 10)) {
    return 'Trigger 2 companion drop radius must be between 0 and 10 km (exclusive of 0).'
  }

  const longKm = Number.parseFloat(editable?.longDistanceThresholdKm?.value)
  if (Number.isFinite(longKm) && (longKm <= 0 || longKm > 100)) {
    return 'Trigger 2 long-distance threshold must be between 0 and 100 km (exclusive of 0).'
  }

  const pickupKm = Number.parseFloat(editable?.interVendorPickupRadiusKm?.value)
  if (Number.isFinite(pickupKm) && (pickupKm <= 0 || pickupKm > 20)) {
    return 'Trigger 3 inter-vendor pickup radius must be between 0 and 20 km (exclusive of 0).'
  }

  const holdSec = durationToSeconds(editable?.holdWindow)
  if (holdSec != null && (holdSec < 0 || holdSec > 600)) {
    return 'Trigger 2 hold window must be between 0 and 600 seconds.'
  }

  const failedOffers = Number.parseInt(String(editable?.requiredFailedOffers?.value ?? ''), 10)
  if (Number.isFinite(failedOffers) && (failedOffers < 2 || failedOffers > 10)) {
    return 'Trigger 3 required failed offers must be between 2 and 10.'
  }

  const maxCar = Number.parseInt(String(editable?.maxCarOrders?.value ?? ''), 10)
  if (Number.isFinite(maxCar) && (maxCar < 2 || maxCar > 3)) {
    return 'Max car orders in a stack must be 2 or 3.'
  }

  return null
}

/** Overview stackingActivity → table rows (empty until live stacking exists). */
export function mapOverviewToStackingActivity(overview) {
  const rows = Array.isArray(overview?.stackingActivity) ? overview.stackingActivity : []
  return rows.map((row) => {
    const r = asRecord(row)
    return {
      id: String(r.id || ''),
      at: r.at ?? null,
      trigger: String(r.trigger || ''),
      triggerLabel: String(r.triggerLabel || r.trigger || '—'),
      orderCount: Number(r.orderCount) || 0,
      orders: Array.isArray(r.orders) ? r.orders.map(String) : [],
      vendorName: String(r.vendorName || '—'),
      vehicleType: String(r.vehicleType || '—'),
      slaClear: r.slaClear !== false,
      outcome: String(r.outcome || r.status || '—'),
      status: String(r.status || ''),
    }
  })
}

// ---------------------------------------------------------------------------
// Radius UI ↔ config
// Editable DispatchRuleSet fields: stagesKm[0..2], expansionDelaySec, broadcastRadiusKm
// Read-only (not DispatchRuleSet): Champ/SLA offer TTLs, fixed no-Champ cancel display
// ---------------------------------------------------------------------------

/** SLA / Champ offer TTL display defaults (not persisted from this screen). */
const DISPLAY_HOT_FOOD_OFFER_SEC = 45
const DISPLAY_OTHER_ON_DEMAND_OFFER_SEC = 90
/** Fixed no-Champ cancel policy display (not a DispatchRuleSet radius field). */
const DISPLAY_NO_CHAMP_CANCEL_SEC = 900

export function mapConfigToRadiusEditable(config) {
  const radius = asRecord(config?.radius)
  const stages = Array.isArray(radius.stagesKm) ? radius.stagesKm : [5, 8, 12]
  const delaySec = Number(radius.expansionDelaySec)
  const expansionDelaySec =
    Number.isFinite(delaySec) && delaySec >= 1 ? Math.floor(delaySec) : 90
  const broadcast = Number(radius.broadcastRadiusKm)
  const broadcastRadiusKm =
    Number.isFinite(broadcast) && broadcast > 0 ? broadcast : 25

  return {
    stage1RadiusKm: createOperatorNumber('≤', stages[0] ?? 5),
    stage2RadiusKm: createOperatorNumber('≤', stages[1] ?? 8),
    stage3RadiusKm: createOperatorNumber('≤', stages[2] ?? 12),
    stage4BroadcastKm: createOperatorNumber('≤', broadcastRadiusKm),
    // Backend has one expansionDelaySec — both stage timers reflect that value.
    stage2To3: secondsToDuration(expansionDelaySec, '≤'),
    stage3To4: secondsToDuration(expansionDelaySec, '≤'),
    // SLA / Champ offer windows — display only
    hotFoodOffer: secondsToDuration(DISPLAY_HOT_FOOD_OFFER_SEC, '≤'),
    otherOnDemandOffer: secondsToDuration(DISPLAY_OTHER_ON_DEMAND_OFFER_SEC, '≤'),
    // Fixed policy display — not written to DispatchRuleSet
    overallAutoCancel: secondsToDuration(DISPLAY_NO_CHAMP_CANCEL_SEC, '≥'),
  }
}

/**
 * Apply Stage 1–3 radii, Stage 4 broadcastRadiusKm, and expansionDelaySec.
 * Preserves unknown radius keys and never enables stacking.
 * Does not write SLA offer TTLs or no-Champ cancel into config.
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

  const broadcast = parsePositiveNumber(
    editable?.stage4BroadcastKm?.value,
    next.radius.broadcastRadiusKm,
  )
  if (broadcast != null) {
    next.radius.broadcastRadiusKm = broadcast
  }

  // Prefer stage2To3; fall back to stage3To4 if needed (both represent expansionDelaySec).
  const delayFromUi =
    durationToSeconds(editable?.stage2To3) ?? durationToSeconds(editable?.stage3To4)
  if (delayFromUi != null) {
    const clamped = Math.min(600, Math.max(1, Math.floor(delayFromUi)))
    next.radius.expansionDelaySec = clamped
  }

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

  const broadcast = Number.parseFloat(editable?.stage4BroadcastKm?.value)
  if (Number.isFinite(broadcast)) {
    if (!(broadcast > s3)) {
      return `Stage 4 broadcast radius (${broadcast} km) must be greater than Stage 3 (${s3} km).`
    }
  }

  const delayA = durationToSeconds(editable?.stage2To3)
  const delayB = durationToSeconds(editable?.stage3To4)
  if (delayA != null && (delayA < 1 || delayA > 600)) {
    return 'Expansion delay (Stage 2→3) must be between 1 and 600 seconds.'
  }
  if (delayB != null && (delayB < 1 || delayB > 600)) {
    return 'Expansion delay (Stage 3→4) must be between 1 and 600 seconds.'
  }
  if (delayA != null && delayB != null && delayA !== delayB) {
    return 'Stage 2→3 and Stage 3→4 timers both map to expansionDelaySec and must match.'
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
      // Buyer labels: ON_ORDER (runtime BUSY) · AVAILABLE (runtime ONLINE).
      // Prefer additive onOrder when present; fall back to legacy occupied bucket.
      delta: `${champs.onOrder ?? champs.occupied ?? 0} On order · ${champs.available ?? 0} Available`,
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
  const versions = Array.isArray(rule.versions)
    ? rule.versions.map((row) => ({
        version: row.version,
        note: row.note ?? null,
        publishedAt: row.publishedAt ?? row.createdAt ?? null,
        publishedByName: row.publishedByName ?? null,
      }))
    : []
  return {
    id: rule.id,
    name: rule.name,
    status: rule.status,
    version: rule.version,
    updatedAt: rule.updatedAt,
    activatedAt: rule.activatedAt,
    pausedAt: rule.pausedAt ?? null,
    versions,
  }
}

/** Prefer ACTIVE, then PAUSED (resume target), else first DRAFT/TEST by list order. */
export function pickWorkingRuleSet(list) {
  const rows = Array.isArray(list) ? list : []
  const active = rows.find((r) => r.status === 'ACTIVE')
  if (active) return active
  const paused = rows.find((r) => r.status === 'PAUSED')
  if (paused) return paused
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
    const changedPaths = Array.isArray(meta.changedPaths) ? meta.changedPaths.join(', ') : null
    return {
      id: row.id,
      timestamp: formatStamp(row.at),
      module: 'Dispatch Rules',
      fieldChanged: row.action || '—',
      changedBy: row.actorName || '—',
      from: meta.from != null ? String(meta.from) : meta.sourceVersion != null ? `v${meta.sourceVersion}` : '—',
      to:
        meta.to != null
          ? String(meta.to)
          : meta.publishedVersion != null
            ? `v${meta.publishedVersion}`
            : meta.version != null
              ? `v${meta.version}`
              : changedPaths || '—',
      reason: meta.note || meta.reason || changedPaths || row.target || '—',
    }
  })

  const evaluationRows = (log?.evaluations ?? []).map((row) => ({
    id: row.id,
    timestamp: formatStamp(row.at),
    order: row.orderNumber || row.orderId || '—',
    champ: row.champName || row.champId || '—',
    eligible: row.eligible === true ? 'Yes' : row.eligible === false ? 'No' : '—',
    selected: row.selected === true ? 'Yes' : row.selected === false ? 'No' : '—',
    score: row.champScore == null ? '—' : String(row.champScore),
    radiusKm: row.radiusStageKm == null ? '—' : `${row.radiusStageKm} km`,
  }))

  const attemptRows = (log?.attempts ?? []).map((row) => ({
    id: row.id,
    timestamp: formatStamp(row.at),
    order: row.orderNumber || row.orderId || '—',
    attemptNo: row.attemptNo == null ? '—' : String(row.attemptNo),
    status: row.status || '—',
    champ: row.champName || row.champId || '—',
    score: row.champScore == null ? '—' : String(row.champScore),
    etaSec: row.pickupEtaSec == null ? '—' : `${row.pickupEtaSec}s`,
    radiusKm: row.radiusStageKm == null ? '—' : `${row.radiusStageKm} km`,
    ruleVersion: row.dispatchRuleVersion == null ? '—' : `v${row.dispatchRuleVersion}`,
  }))

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
    evaluations: {
      title: catalogShell?.evaluations?.title ?? 'Dispatch candidate evaluations',
      columns: catalogShell?.evaluations?.columns ?? [
        'Timestamp',
        'Order',
        'Champ',
        'Eligible',
        'Selected',
        'Score',
        'Radius',
      ],
      rows: evaluationRows,
    },
    attempts: {
      title: catalogShell?.attempts?.title ?? 'Dispatch attempts',
      columns: catalogShell?.attempts?.columns ?? [
        'Timestamp',
        'Order',
        'Attempt',
        'Status',
        'Champ',
        'Score',
        'ETA',
        'Radius',
        'Rule ver.',
      ],
      rows: attemptRows,
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
