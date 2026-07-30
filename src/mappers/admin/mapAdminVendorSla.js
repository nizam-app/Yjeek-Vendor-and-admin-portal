import { ApiError } from '../../api/errors'

function num(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

function str(value) {
  if (value == null || value === '') return null
  return String(value)
}

function readReadyTargetPct(config = {}) {
  return (
    num(config.readyOnlineTargetPct) ??
    num(config.readyOnlineMarginPct) ??
    num(config.readyTimeBufferPct)
  )
}

function formatMin(value, { op = '≤' } = {}) {
  const n = num(value)
  if (n == null) return '—'
  return `${op} ${n} min`
}

function formatPctTarget(value) {
  const n = num(value)
  if (n == null) return '—'
  return `≥ ${n}%`
}

function mapServiceModes(data = {}) {
  const modes =
    data.serviceModes && typeof data.serviceModes === 'object' && !Array.isArray(data.serviceModes)
      ? data.serviceModes
      : data

  return {
    hotFoodOnDemand: Boolean(modes.hotFoodOnDemand),
    dineIn: Boolean(modes.dineIn),
    pickup: Boolean(modes.pickup),
    scheduledDelivery: Boolean(modes.scheduledDelivery),
    services: Boolean(modes.services),
  }
}

function mapCompliance(raw) {
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const label = str(item.label || item.name || item.metric)
        const value = num(item.value ?? item.pct ?? item.percent)
        if (!label || value == null) return null
        return { label, value }
      })
      .filter(Boolean)
  }

  if (typeof raw === 'object') {
    const labels = {
      acceptance: 'Acceptance',
      prepOnTime: 'Prep on-time',
      prep: 'Prep on-time',
      ready: 'Ready',
      onTimeDelivery: 'On-time delivery',
      delivery: 'On-time delivery',
    }
    return Object.entries(raw)
      .map(([key, value]) => {
        const n = num(value)
        if (n == null) return null
        return { label: labels[key] || key, value: n }
      })
      .filter(Boolean)
  }

  return []
}

/**
 * Map GET /admin/vendors/:vendorId/sla `data` → AdminVendorSla UI shape.
 *
 * Confirmed fields (screenshot):
 *   serviceModes.{dineIn,pickup,scheduledDelivery,services}
 *   config.acceptanceCutoffMin, prepTimeHotFoodMin, readyOnline*Pct,
 *   handoverToChampMin, dailyOrderCutoff, kitchenClose,
 *   config.kpiWeights.{accuracy,packing,prepTime,reliability}
 *
 * Compliance / model name may exist (endpoint title) but were not fully
 * visible in the screenshot — mapped when present; never invented.
 */
export function mapAdminVendorSlaResponse(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ApiError({
      message: 'Invalid vendor SLA response from the server.',
    })
  }

  const config =
    data.config && typeof data.config === 'object' && !Array.isArray(data.config)
      ? data.config
      : {}
  const weights =
    config.kpiWeights && typeof config.kpiWeights === 'object' ? config.kpiWeights : {}
  const serviceModes = mapServiceModes(data)
  const readyPct = readReadyTargetPct(config)
  const acceptance = num(config.acceptanceCutoffMin)
  const prep = num(config.prepTimeHotFoodMin)
  const handover = num(config.handoverToChampMin)

  const modelName =
    str(data.modelName) ||
    str(data.slaModelName) ||
    str(data.slaModel?.name) ||
    str(data.name) ||
    'Vendor SLA'

  const status = str(data.status) || (data.slaModelId || data.applied ? 'Applied' : 'Applied')

  const metaParts = [
    data.slaModelId ? `Model id ${data.slaModelId}` : null,
    serviceModes.pickup ? 'Pickup' : null,
    serviceModes.scheduledDelivery ? 'Scheduled delivery' : null,
    serviceModes.hotFoodOnDemand ? 'Hot food' : null,
    serviceModes.dineIn ? 'Dine-in' : null,
    serviceModes.services ? 'Services' : null,
  ].filter(Boolean)

  const metrics = [
    {
      label: 'Acceptance cut-off',
      value: formatMin(acceptance),
      hint: acceptance != null ? 'From vendor SLA config' : '—',
    },
    {
      label: 'Prep time SLA',
      value: prep != null ? `${prep} min` : '—',
      hint: 'Hot food category',
    },
    {
      label: 'Ready on-time',
      value: formatPctTarget(readyPct),
      hint: 'Ready target',
    },
    {
      label: 'Handover to champ',
      value: formatMin(handover),
      hint: 'Food category',
    },
  ]

  const rules = [
    ['Acceptance cut-off', formatMin(acceptance)],
    ['Prep time (Hot food)', prep != null ? `${prep} min` : '—'],
    ['Ready on-time target', formatPctTarget(readyPct)],
    ['Handover to champ', formatMin(handover)],
    ['Daily order cut-off', str(config.dailyOrderCutoff) || '—'],
    ['Kitchen closes', str(config.kitchenClose) || '—'],
  ]

  const vpiWeights = [
    { label: 'Accuracy', value: num(weights.accuracy) ?? 0 },
    { label: 'Packing', value: num(weights.packing) ?? 0 },
    { label: 'Prep time', value: num(weights.prepTime) ?? 0 },
    { label: 'Reliability', value: num(weights.reliability) ?? 0 },
  ]

  const compliance = mapCompliance(
    data.compliance || data.compliance30d || data.complianceLast30d || data.last30dCompliance,
  )

  return {
    status,
    modelName,
    meta: metaParts.length ? metaParts.join(' · ') : 'Vendor SLA configuration',
    metrics,
    rules,
    vpiWeights,
    compliance,
    serviceModes,
    slaModelId: data.slaModelId ? String(data.slaModelId) : null,
    config: {
      acceptanceCutoffMin: acceptance,
      prepTimeHotFoodMin: prep,
      readyOnlineTargetPct: readyPct,
      handoverToChampMin: handover,
      dailyOrderCutoff: str(config.dailyOrderCutoff),
      kitchenClose: str(config.kitchenClose),
      kpiWeights: {
        accuracy: num(weights.accuracy),
        packing: num(weights.packing),
        prepTime: num(weights.prepTime),
        reliability: num(weights.reliability),
      },
    },
    raw: data,
  }
}

/**
 * Map Edit SLA form / UI object → PATCH body.
 * Confirmed Postman sample: slaModelId, serviceModes, config subset.
 */
export function mapAdminUpdateVendorSlaRequest(form = {}) {
  const body = {}

  const slaModelId = str(form.slaModelId)
  if (slaModelId) body.slaModelId = slaModelId

  const modes = form.serviceModes
  if (modes && typeof modes === 'object') {
    const serviceModes = {}
    for (const key of ['hotFoodOnDemand', 'pickup', 'scheduledDelivery', 'dineIn', 'services']) {
      if (typeof modes[key] === 'boolean') serviceModes[key] = modes[key]
    }
    if (Object.keys(serviceModes).length) body.serviceModes = serviceModes
  }

  const cfg = form.config || form
  const config = {}
  const acceptance = num(cfg.acceptanceCutoffMin)
  const prep = num(cfg.prepTimeHotFoodMin)
  if (acceptance != null) config.acceptanceCutoffMin = acceptance
  if (prep != null) config.prepTimeHotFoodMin = prep
  if (Object.keys(config).length) body.config = config

  return body
}
