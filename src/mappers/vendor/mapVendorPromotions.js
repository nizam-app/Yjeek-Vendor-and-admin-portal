/**
 * Map confirmed Vendor promotions APIs into Promotions page UI shape.
 *
 * Confirmed:
 *   GET /vendor-panel/promotions
 *     data: { count, items: [ promo ] }
 *   GET /vendor-panel/promotions/summary
 *     data: {
 *       activePromotions, activeTrend, redemptions30d, redemptionsChangePercent,
 *       revenueFromPromos, revenueChangePercent, avgDiscountPct, discountGiven30d
 *     }
 *   GET /vendor-panel/promotions/:promotionId
 *     data: { id, name, type, status, isPaused, scope, appliesTo, startsAt, endsAt, ... }
 *   GET /vendor-panel/promotions/:promotionId/analytics
 *     data: enriched promotion (products, rewardProducts, usageCount, used, ...)
 *   PATCH /vendor-panel/promotions/:promotionId/pause
 *     data: updated promotion (status PAUSED, isPaused true)
 *   PATCH /vendor-panel/promotions/:promotionId
 *     Update (Item/category deal | Free delivery | Buy X Get Y) — type-specific body
 */

import { ApiError } from '../../api/errors'

export const PROMOTION_FILTERS = ['All', 'Active', 'Scheduled', 'Paused', 'Ended']

const PROMO_TYPES_SET = new Set([
  'Item / category deal',
  'Free delivery',
  'Buy X Get Y',
])

const TYPE_LABELS = {
  BUY_X_GET_Y: 'Buy X Get Y',
  FREE_DELIVERY: 'Free delivery',
  PERCENTAGE_OFF: '% off',
  PERCENT_OFF: '% off',
  AMOUNT_OFF: 'Item / category deal',
  ITEM_CATEGORY_DEAL: 'Item / category deal',
  CATEGORY_DEAL: 'Item / category deal',
  ITEM_DEAL: 'Item / category deal',
}

function isUiShapedPromotion(item) {
  return item && typeof item === 'object' && typeof item.title === 'string' && typeof item.type === 'string'
}

function formatStatus(item) {
  if (item?.isPaused === true) return 'Paused'
  const raw = String(item?.status || '')
    .trim()
    .toUpperCase()
  if (raw === 'ACTIVE') return 'Active'
  if (raw === 'SCHEDULED') return 'Scheduled'
  if (raw === 'PAUSED') return 'Paused'
  if (raw === 'ENDED' || raw === 'EXPIRED' || raw === 'COMPLETED') return 'Ended'
  if (['Active', 'Scheduled', 'Paused', 'Ended'].includes(item?.status)) return item.status
  return item?.status ? String(item.status) : 'Active'
}

function formatType(type) {
  const key = String(type || '')
    .trim()
    .toUpperCase()
  if (TYPE_LABELS[key]) return TYPE_LABELS[key]
  if (!type) return 'Item / category deal'
  // Already UI label
  if (String(type).includes(' ') || String(type).includes('%')) return String(type)
  return String(type)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return 'BHD 0'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `BHD ${numeric.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatPercentDelta(value) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  if (numeric === 0) return '0%'
  const sign = numeric > 0 ? '+' : ''
  return `${sign}${numeric}%`
}

function formatPeriod(item) {
  if (item.period) return item.period
  const start = item.startsAt || item.startDate || item.startAt
  const end = item.endsAt || item.endDate || item.endAt
  if (start && end) {
    try {
      const s = new Date(start)
      const e = new Date(end)
      if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
        const fmt = (d) =>
          d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
        return `${fmt(s)}–${fmt(e)}`
      }
    } catch {
      // fall through
    }
  }
  if (start) {
    try {
      const s = new Date(start)
      if (!Number.isNaN(s.getTime())) {
        return `Starts ${s.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
      }
    } catch {
      // fall through
    }
  }
  if (item.isPaused) return 'Paused'
  return 'Ongoing'
}

function resolveApplyTo(item) {
  return item.applyTo || item.appliesTo || null
}

function formatDateRangeMeta(item) {
  const start = item.startsAt || item.startDate || item.startAt
  const end = item.endsAt || item.endDate || item.endAt
  if (!start && !end) return null
  try {
    const fmt = (value) => {
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return null
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    }
    const s = start ? fmt(start) : null
    const e = end ? fmt(end) : null
    if (s && e) return `${s}–${e}`
    if (s) return `from ${s}`
    if (e) return `until ${e}`
  } catch {
    // fall through
  }
  return null
}

function buildSubtitle(item, typeLabel) {
  if (item.subtitle) return item.subtitle

  const applyTo = resolveApplyTo(item)
  const parts = []
  if (typeLabel === 'Buy X Get Y') {
    const buy = item.buyQuantity ?? 1
    const get = item.getQuantity ?? 1
    parts.push(`Buy ${buy} Get ${get}`)
  } else if (typeLabel === 'Free delivery') {
    parts.push('Free delivery')
  } else if (typeLabel === '% off' && item.discountValue != null) {
    parts.push(`${item.discountValue}% off`)
  } else if (item.discountValue != null && item.discountUnit) {
    parts.push(`${item.discountValue} ${String(item.discountUnit).toLowerCase()}`)
  }

  if (item.scope) parts.push(String(item.scope).toLowerCase())
  else if (applyTo === 'SELECTED_ITEMS') parts.push('selected items')
  else if (applyTo === 'ALL_MENU' || applyTo === 'ENTIRE_MENU') parts.push('all menu')

  if (item.minOrderAmount != null && item.minOrderAmount !== '') {
    parts.push(`min BHD ${Number(item.minOrderAmount)}`)
  }

  return parts.filter(Boolean).join(' · ') || 'Promotion'
}

function buildDetailMeta(item, typeLabel) {
  if (item.detailMeta) return item.detailMeta

  const parts = []
  if (typeLabel === 'Buy X Get Y') {
    parts.push('Buy X Get Y')
    parts.push(`Buy ${item.buyQuantity ?? 1} Get ${item.getQuantity ?? 1}`)
  } else if (typeLabel === 'Free delivery') {
    parts.push('Free delivery')
  } else if (typeLabel === '% off') {
    parts.push('Percentage off')
    if (item.discountValue != null) parts.push(`${item.discountValue}%`)
  } else {
    parts.push(typeLabel)
    if (item.discountValue != null) {
      const unit = item.discountUnit ? ` ${String(item.discountUnit).toLowerCase()}` : ''
      parts.push(`${item.discountValue}${unit}`)
    }
  }

  if (item.code || item.promoCode) {
    parts.push(`code ${item.code || item.promoCode}`)
  }

  const range = formatDateRangeMeta(item)
  if (range) parts.push(range)

  return parts.filter(Boolean).join(' · ') || buildSubtitle(item, typeLabel)
}

function formatNamedList(items) {
  if (!Array.isArray(items) || items.length === 0) return null
  const names = items
    .map((entry) => (typeof entry === 'string' ? entry : entry?.name))
    .filter(Boolean)
  return names.length ? names.join(', ') : null
}

function buildSettingsFromApi(item, typeLabel) {
  const applyTo = resolveApplyTo(item)
  const rows = [{ label: 'Type', value: typeLabel }]

  if (typeLabel === 'Buy X Get Y') {
    const reward =
      item.bogoRewardType === 'FREE'
        ? 'Free'
        : item.bogoRewardPercent != null
          ? `${item.bogoRewardPercent}% off`
          : 'Reward'
    rows.push({
      label: 'Buy / Get',
      value: `${item.buyQuantity ?? 1} / ${item.getQuantity ?? 1} · ${reward}`,
    })

    const buyItems = formatNamedList(item.products)
    if (buyItems) rows.push({ label: 'Buy items', value: buyItems })

    const rewardItems = formatNamedList(item.rewardProducts)
    if (rewardItems) rows.push({ label: 'Get items', value: rewardItems })
    else if (item.discountCheapestItem) {
      rows.push({ label: 'Reward item', value: 'Cheapest item' })
    }

    if (item.limitOneRewardPerOrder) {
      rows.push({ label: 'Per order', value: '1 reward max' })
    }
  } else if (item.discountValue != null) {
    const unit =
      item.discountUnit === 'PERCENT' || item.discountUnit === '%'
        ? '%'
        : item.discountUnit
          ? ` ${String(item.discountUnit).toLowerCase()}`
          : ''
    const cap = item.maxDiscountCap != null ? ` · cap BHD ${item.maxDiscountCap}` : ''
    rows.push({ label: 'Discount', value: `${item.discountValue}${unit}${cap}` })
  }

  if (item.minOrderAmount != null && item.minOrderAmount !== '') {
    rows.push({ label: 'Min order', value: `BHD ${item.minOrderAmount}` })
  }

  const categoryNames = formatNamedList(item.categories)
  rows.push({
    label: 'Applies to',
    value:
      categoryNames ||
      item.scope ||
      (applyTo === 'SELECTED_ITEMS'
        ? 'Selected items'
        : applyTo === 'ALL_MENU' || applyTo === 'ENTIRE_MENU'
          ? 'Entire menu'
          : 'Entire menu'),
  })

  rows.push({
    label: 'Eligibility',
    value: item.firstOrderOnly ? 'First order only' : 'Everyone',
  })

  const branchNames = formatNamedList(item.branches)
  if (branchNames) {
    rows.push({ label: 'Branches', value: branchNames })
  } else {
    rows.push({
      label: 'Branches',
      value: item.applyToAllBranches ? 'All branches' : 'Selected branches',
    })
  }

  if (item.usesPerCustomer != null) {
    rows.push({
      label: 'Per customer',
      value: `${item.usesPerCustomer} use${Number(item.usesPerCustomer) === 1 ? '' : 's'}`,
    })
  }

  if (item.totalUsageLimit != null) {
    rows.push({
      label: 'Usage limit',
      value: String(item.totalUsageLimit),
    })
  }

  if (item.waiveDeliveryFee) {
    rows.push({ label: 'Delivery fee', value: 'Waived' })
  }

  const range = formatDateRangeMeta(item)
  if (range) {
    rows.push({ label: 'Schedule', value: item.noEndDate ? `${range} (no end)` : range })
  }

  return rows
}

/**
 * Build detail KPI cards from confirmed analytics fields only.
 * Does not invent revenue / AOV metrics that are absent from the API.
 */
function buildDetailKpis(item) {
  if (Array.isArray(item.kpis) && item.kpis.length > 0) return item.kpis

  const used = item.used ?? item.usageCount
  if (used === null || used === undefined) return null

  const limit = item.totalUsageLimit
  return [
    {
      label: 'Redemptions',
      value: Number(used).toLocaleString(),
      note: limit != null ? `of ${Number(limit).toLocaleString()} limit` : 'total uses',
      tone: 'muted',
    },
  ]
}

/**
 * Map one promotion list/detail/analytics item into the Promotions UI shape.
 */
export function mapVendorPromotion(item) {
  if (!item || typeof item !== 'object') return null

  // Unwrap nested analytics payload if present: { promotion: {...}, ... }
  const source =
    item.promotion && typeof item.promotion === 'object' && !item.name && !item.title
      ? { ...item.promotion, ...item, ...item.promotion }
      : item

  if (isUiShapedPromotion(source)) {
    return {
      ...source,
      id: source.id,
      title: source.title,
      subtitle: source.subtitle || '',
      type: source.type,
      scope: source.scope,
      status: source.status,
      period: source.period,
      used: source.used ?? source.usageCount ?? 0,
    }
  }

  const type = formatType(source.type)
  const status = formatStatus(source)
  const applyTo = resolveApplyTo(source)
  const used = source.used ?? source.usageCount ?? 0

  return {
    id: source.id,
    title: source.name || source.title || 'Untitled promotion',
    subtitle: buildSubtitle(source, type),
    type,
    typeRaw: source.type || null,
    scope: source.scope || (source.applyToAllBranches ? 'All branches' : 'Selected branches'),
    status,
    isPaused: Boolean(source.isPaused) || status === 'Paused',
    period: formatPeriod(source),
    used,
    usageCount: source.usageCount ?? used,
    totalUsageLimit: source.totalUsageLimit ?? null,
    usesPerCustomer: source.usesPerCustomer ?? null,
    applyTo,
    applyToAllBranches: Boolean(source.applyToAllBranches),
    discountValue: source.discountValue ?? null,
    discountUnit: source.discountUnit ?? null,
    maxDiscountCap: source.maxDiscountCap ?? null,
    minOrderAmount: source.minOrderAmount ?? null,
    showDealBadge: Boolean(source.showDealBadge),
    waiveDeliveryFee: Boolean(source.waiveDeliveryFee),
    firstOrderOnly: Boolean(source.firstOrderOnly),
    buyQuantity: source.buyQuantity ?? null,
    getQuantity: source.getQuantity ?? null,
    bogoRewardType: source.bogoRewardType ?? null,
    bogoRewardPercent: source.bogoRewardPercent ?? null,
    discountCheapestItem: Boolean(source.discountCheapestItem),
    limitOneRewardPerOrder: Boolean(source.limitOneRewardPerOrder),
    noEndDate: Boolean(source.noEndDate),
    startsAt: source.startsAt || source.startDate || null,
    endsAt: source.endsAt || source.endDate || null,
    products: Array.isArray(source.products) ? source.products : [],
    rewardProducts: Array.isArray(source.rewardProducts) ? source.rewardProducts : [],
    categories: Array.isArray(source.categories) ? source.categories : [],
    branches: Array.isArray(source.branches) ? source.branches : [],
    detailMeta: buildDetailMeta(source, type),
    kpis: buildDetailKpis(source),
    chart: Array.isArray(source.chart)
      ? source.chart
      : Array.isArray(source.redemptionsLast14Days)
        ? source.redemptionsLast14Days
        : Array.isArray(source.dailyRedemptions)
          ? source.dailyRedemptions
          : null,
    chartPeakDay: source.chartPeakDay ?? null,
    chartPeakValue: source.chartPeakValue ?? null,
    chartTotal: source.chartTotal ?? used,
    settings:
      Array.isArray(source.settings) && source.settings.length
        ? source.settings
        : buildSettingsFromApi(source, type),
    recent: (Array.isArray(source.recent)
      ? source.recent
      : Array.isArray(source.recentRedemptions)
        ? source.recentRedemptions
        : []
    )
      .map(mapRecentRedemptionRow)
      .filter(Boolean),
    categoryIds: Array.isArray(source.categoryIds)
      ? source.categoryIds.map(String)
      : (Array.isArray(source.categories) ? source.categories : [])
          .map((c) => c?.id || c?.categoryId)
          .filter(Boolean)
          .map(String),
    productIds: Array.isArray(source.productIds)
      ? source.productIds.map(String)
      : (Array.isArray(source.products) ? source.products : [])
          .map((p) => p?.id || p?.productId)
          .filter(Boolean)
          .map(String),
    rewardProductIds: Array.isArray(source.rewardProductIds)
      ? source.rewardProductIds.map(String)
      : (Array.isArray(source.rewardProducts) ? source.rewardProducts : [])
          .map((p) => p?.id || p?.productId)
          .filter(Boolean)
          .map(String),
    appliesToRaw: source.appliesTo || source.applyTo || null,
    discountUnitRaw: source.discountUnit || null,
    bogoRewardTypeRaw: source.bogoRewardType || null,
  }
}

function mapRecentRedemptionRow(entry) {
  if (!entry || typeof entry !== 'object') return null
  const discount =
    entry.discount ??
    entry.discountLabel ??
    (entry.discountAmount != null && entry.discountAmount !== ''
      ? String(entry.discountAmount)
      : null)
  const total =
    entry.total ??
    entry.orderTotal ??
    entry.totalAmount ??
    (entry.amount != null ? String(entry.amount) : null)
  const when =
    entry.when ||
    entry.timeLabel ||
    entry.redeemedAtLabel ||
    (entry.redeemedAt || entry.createdAt
      ? formatRelativeOrDate(entry.redeemedAt || entry.createdAt)
      : null)

  return {
    order: entry.order || entry.orderNumber || entry.orderId || entry.id || '—',
    customer:
      entry.customer ||
      entry.customerName ||
      entry.userName ||
      entry.user?.name ||
      entry.customer?.name ||
      '—',
    discount: discount || '—',
    total: total || '—',
    when: when || '—',
  }
}

function formatRelativeOrDate(value) {
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

/**
 * Map GET /vendor-panel/promotions/:promotionId `data` into detail UI shape.
 */
export function mapVendorPromotionDetailResponse(data) {
  if (!data || typeof data !== 'object') return null
  return mapVendorPromotion(data)
}

/**
 * Map GET /vendor-panel/promotions/:promotionId/analytics `data`.
 */
export function mapVendorPromotionAnalyticsResponse(data) {
  if (!data || typeof data !== 'object') return null
  return mapVendorPromotion(data)
}

/**
 * Map GET /vendor-panel/promotions `data` into a promotions list.
 */
export function mapVendorPromotionsResponse(data) {
  // Legacy mock shape: { kpis, filters, promotions }
  if (data && Array.isArray(data.promotions)) {
    return {
      count: data.promotions.length,
      items: data.promotions.map(mapVendorPromotion).filter(Boolean),
      kpis: data.kpis || null,
      filters: data.filters || PROMOTION_FILTERS,
    }
  }

  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : []

  return {
    count: Number(data?.count) || rawItems.length,
    items: rawItems.map(mapVendorPromotion).filter(Boolean),
    kpis: null,
    filters: PROMOTION_FILTERS,
  }
}

/**
 * Map GET /vendor-panel/promotions/summary into KPI cards.
 */
export function mapVendorPromotionsSummaryResponse(data) {
  if (!data || typeof data !== 'object') {
    return [
      { label: 'Active promotions', value: '0' },
      { label: 'Redemptions (30d)', value: '0' },
      { label: 'Revenue from promos', value: 'BHD 0' },
      { label: 'Avg. discount', value: '0%', note: 'per order' },
    ]
  }

  // Already UI-shaped KPI array
  if (Array.isArray(data) && data[0]?.label) return data
  if (Array.isArray(data.kpis) && data.kpis[0]?.label) return data.kpis

  const redemptionsDelta = formatPercentDelta(data.redemptionsChangePercent)
  const revenueDelta = formatPercentDelta(data.revenueChangePercent)
  const avgPct = data.avgDiscountPct == null ? 0 : Number(data.avgDiscountPct)

  return [
    {
      label: 'Active promotions',
      value: String(data.activePromotions ?? 0),
      delta: data.activeTrend || null,
    },
    {
      label: 'Redemptions (30d)',
      value: Number(data.redemptions30d || 0).toLocaleString(),
      delta: redemptionsDelta,
    },
    {
      label: 'Revenue from promos',
      value: formatMoney(data.revenueFromPromos),
      delta: revenueDelta,
    },
    {
      label: 'Avg. discount',
      value: `${Number.isNaN(avgPct) ? 0 : avgPct}%`,
      note: 'per order',
    },
  ]
}

const MONTH_INDEX = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

const UI_TYPE_TO_API = {
  'Item / category deal': 'ITEM_CATEGORY_DEAL',
  'Free delivery': 'FREE_DELIVERY',
  'Buy X Get Y': 'BUY_X_GET_Y',
}

const APPLIES_UI_TO_API = {
  'All menu': 'ALL_MENU',
  'Selected categories': 'SELECTED_CATEGORIES',
  'Selected items': 'SELECTED_ITEMS',
}

const APPLIES_API_TO_UI = {
  ALL_MENU: 'All menu',
  ENTIRE_MENU: 'All menu',
  SELECTED_CATEGORIES: 'Selected categories',
  SELECTED_ITEMS: 'Selected items',
}

/**
 * Parse UI / ISO date → ISO string for PATCH body.
 */
export function parseVendorPromoDate(value, { endOfDay = false } = {}) {
  if (value == null || value === '') return null
  const raw = String(value).trim()
  if (!raw) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return null
    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      date.setUTCHours(23, 59, 59, 999)
    }
    return date.toISOString()
  }

  const match = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/)
  if (match) {
    const month = MONTH_INDEX[match[2].toLowerCase()]
    if (month == null) return null
    const day = Number(match[1])
    const year = Number(match[3])
    const date = new Date(
      Date.UTC(
        year,
        month,
        day,
        endOfDay ? 23 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 999 : 0,
      ),
    )
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  const fallback = new Date(raw)
  return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString()
}

export function formatVendorPromoDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function toNamedSelections(list, idKeys = ['id']) {
  return (Array.isArray(list) ? list : [])
    .map((item) => {
      if (item == null) return null
      if (typeof item === 'string' || typeof item === 'number') {
        const id = String(item).trim()
        return id ? { id, name: id } : null
      }
      const id = String(
        idKeys.map((k) => item[k]).find(Boolean) || item.categoryId || item.productId || '',
      ).trim()
      if (!id) return null
      return { id, name: item.name || item.label || item.title || id }
    })
    .filter(Boolean)
}

function idsFromSelections(selections) {
  return (Array.isArray(selections) ? selections : [])
    .map((item) => String(item?.id || item || '').trim())
    .filter(Boolean)
}

function numOrUndefined(value) {
  if (value === null || value === undefined || value === '') return undefined
  const numeric = Number(String(value).replace(/,/g, ''))
  return Number.isNaN(numeric) ? undefined : numeric
}

/**
 * Map GET detail/analytics → ConfigurePromotion form state.
 */
export function mapVendorPromotionToEditForm(promo) {
  if (!promo || typeof promo !== 'object') return null

  const typeRaw = String(promo.typeRaw || promo.type || '')
    .trim()
    .toUpperCase()
  const promoType =
    TYPE_LABELS[typeRaw] ||
    (PROMO_TYPES_SET.has(promo.type) ? promo.type : 'Item / category deal')

  const appliesRaw = String(promo.appliesToRaw || promo.appliesTo || promo.applyTo || '')
    .trim()
    .toUpperCase()
  const appliesTo = APPLIES_API_TO_UI[appliesRaw] || 'All menu'

  const unitRaw = String(promo.discountUnitRaw || promo.discountUnit || 'PERCENT').toUpperCase()
  const unit = unitRaw === 'PERCENT' || unitRaw === '%' ? '%' : 'BHD'

  const bogoRaw = String(promo.bogoRewardTypeRaw || promo.bogoRewardType || 'FREE').toUpperCase()
  const reward =
    bogoRaw === 'FREE' ? 'Free' : bogoRaw.includes('50') ? '50% off' : '% off'

  const categories = toNamedSelections(promo.categories, ['id', 'categoryId'])
  const products = toNamedSelections(promo.products, ['id', 'productId'])
  const rewards = toNamedSelections(promo.rewardProducts, ['id', 'productId'])

  const categoryIds = Array.isArray(promo.categoryIds) ? promo.categoryIds : []
  const productIds = Array.isArray(promo.productIds) ? promo.productIds : []
  const rewardProductIds = Array.isArray(promo.rewardProductIds) ? promo.rewardProductIds : []

  return {
    promoType,
    active: !promo.isPaused && String(promo.status || '').toLowerCase() !== 'paused',
    showDealBadge: promo.showDealBadge !== false,
    waiveFee: Boolean(promo.waiveDeliveryFee),
    firstOrderOnly: Boolean(promo.firstOrderOnly),
    noEndDate: Boolean(promo.noEndDate),
    discountCheapest: promo.discountCheapestItem !== false,
    limitOneReward: promo.limitOneRewardPerOrder !== false,
    appliesTo,
    branchScope: promo.applyToAllBranches === false ? 'Selected branches' : 'All branches',
    unit,
    reward,
    tags:
      categories.length > 0
        ? categories
        : categoryIds.map((id) => ({ id: String(id), name: String(id) })),
    buyItems:
      products.length > 0
        ? products
        : productIds.map((id) => ({ id: String(id), name: String(id) })),
    getItems:
      rewards.length > 0
        ? rewards
        : rewardProductIds.map((id) => ({ id: String(id), name: String(id) })),
    form: {
      name: promo.title || promo.name || '',
      discount: promo.discountValue != null ? String(promo.discountValue) : '',
      maxCap: promo.maxDiscountCap != null ? String(promo.maxDiscountCap) : '',
      minOrder: promo.minOrderAmount != null ? String(promo.minOrderAmount) : '',
      buyQty: promo.buyQuantity != null ? String(promo.buyQuantity) : '1',
      getQty: promo.getQuantity != null ? String(promo.getQuantity) : '1',
      startDate: formatVendorPromoDateInput(promo.startsAt),
      endDate: formatVendorPromoDateInput(promo.endsAt),
      usageLimit: promo.totalUsageLimit != null ? String(promo.totalUsageLimit) : '',
      perCustomer: promo.usesPerCustomer != null ? String(promo.usesPerCustomer) : '',
    },
  }
}

/**
 * Map ConfigurePromotion form → PATCH /vendor-panel/promotions/:id body.
 * Confirmed Postman samples per type (ITEM_CATEGORY_DEAL | FREE_DELIVERY | BUY_X_GET_Y).
 */
export function mapVendorUpdatePromotionRequest(input = {}) {
  const {
    promoType = 'Item / category deal',
    active = true,
    showDealBadge = true,
    waiveFee = true,
    firstOrderOnly = false,
    noEndDate = false,
    discountCheapest = true,
    limitOneReward = true,
    appliesTo = 'All menu',
    branchScope = 'All branches',
    unit = '%',
    reward = 'Free',
    tags = [],
    buyItems = [],
    getItems = [],
    form = {},
  } = input

  const name = String(form.name || '').trim()
  if (!name) {
    throw new ApiError({ message: 'Promotion name is required.' })
  }

  const type = UI_TYPE_TO_API[promoType] || 'ITEM_CATEGORY_DEAL'
  const startsAt = parseVendorPromoDate(form.startDate)
  if (!startsAt) {
    throw new ApiError({ message: 'Start date is required.' })
  }

  const endsAt = noEndDate ? null : parseVendorPromoDate(form.endDate, { endOfDay: true })
  if (!noEndDate && !endsAt) {
    throw new ApiError({ message: 'End date is required (or enable No end date).' })
  }

  const base = {
    name,
    type,
    isPaused: !active,
    applyToAllBranches: branchScope !== 'Selected branches',
    startsAt,
    endsAt: noEndDate ? null : endsAt,
    noEndDate: Boolean(noEndDate),
    totalUsageLimit: numOrUndefined(form.usageLimit),
    usesPerCustomer: numOrUndefined(form.perCustomer),
  }

  if (base.totalUsageLimit === undefined) delete base.totalUsageLimit
  if (base.usesPerCustomer === undefined) delete base.usesPerCustomer
  if (base.endsAt == null) delete base.endsAt

  if (type === 'ITEM_CATEGORY_DEAL') {
    const appliesToApi = APPLIES_UI_TO_API[appliesTo] || 'ALL_MENU'
    const body = {
      ...base,
      discountValue: numOrUndefined(form.discount),
      discountUnit: unit === 'BHD' ? 'AMOUNT' : 'PERCENT',
      maxDiscountCap: numOrUndefined(form.maxCap),
      minOrderAmount: numOrUndefined(form.minOrder),
      showDealBadge: Boolean(showDealBadge),
      appliesTo: appliesToApi,
    }

    if (body.discountValue === undefined) {
      throw new ApiError({ message: 'Discount value is required.' })
    }
    if (body.maxDiscountCap === undefined) delete body.maxDiscountCap
    if (body.minOrderAmount === undefined) delete body.minOrderAmount

    if (appliesToApi === 'SELECTED_CATEGORIES') {
      body.categoryIds = idsFromSelections(tags)
      if (!body.categoryIds.length) {
        throw new ApiError({ message: 'Select at least one category.' })
      }
    }
    if (appliesToApi === 'SELECTED_ITEMS') {
      body.productIds = idsFromSelections(tags.length ? tags : buyItems)
      if (!body.productIds.length) {
        throw new ApiError({ message: 'Select at least one item.' })
      }
    }

    return body
  }

  if (type === 'FREE_DELIVERY') {
    const body = {
      ...base,
      waiveDeliveryFee: Boolean(waiveFee),
      minOrderAmount: numOrUndefined(form.minOrder),
      firstOrderOnly: Boolean(firstOrderOnly),
    }
    if (body.minOrderAmount === undefined) delete body.minOrderAmount
    return body
  }

  // BUY_X_GET_Y
  const productIds = idsFromSelections(buyItems)
  const rewardProductIds = idsFromSelections(getItems)
  if (!productIds.length) {
    throw new ApiError({ message: 'Select at least one Buy (X) item.' })
  }
  if (!rewardProductIds.length) {
    throw new ApiError({ message: 'Select at least one Get (Y) reward item.' })
  }

  const buyQuantity = numOrUndefined(form.buyQty) ?? 1
  const getQuantity = numOrUndefined(form.getQty) ?? 1
  const bogoRewardType =
    reward === 'Free' ? 'FREE' : reward === '50% off' ? 'PERCENT_50' : 'PERCENT'

  return {
    ...base,
    buyQuantity,
    getQuantity,
    bogoRewardType,
    productIds,
    rewardProductIds,
    discountCheapestItem: Boolean(discountCheapest),
    limitOneRewardPerOrder: Boolean(limitOneReward),
  }
}

