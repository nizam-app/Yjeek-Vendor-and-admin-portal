import { ApiError } from '../../api/errors'

const DASH = '—'

function asText(value) {
  if (value === null || value === undefined || value === '') return DASH
  return String(value)
}

function formatMoneyBhd(value) {
  if (value === null || value === undefined || value === '') return DASH
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return asText(value)
  return `BHD ${numeric.toFixed(3)}`
}

function formatCompactMoney(value) {
  if (value === null || value === undefined || value === '') return DASH
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return asText(value)
  if (Math.abs(numeric) >= 1000) {
    const compact = numeric / 1000
    const digits = compact >= 100 ? 0 : 1
    return `BHD ${compact.toFixed(digits)}k`
  }
  return `BHD ${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}`
}

function formatCount(value) {
  if (value === null || value === undefined || value === '') return '0'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return asText(value)
  return numeric.toLocaleString()
}

function formatPct(value) {
  if (value === null || value === undefined || value === '') return DASH
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return asText(value)
  return `${numeric % 1 === 0 ? numeric : numeric.toFixed(1)}%`
}

function formatMinutes(value) {
  if (value === null || value === undefined || value === '') return DASH
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return asText(value)
  return `${Math.round(numeric)} min`
}

function formatKm(value) {
  if (value === null || value === undefined || value === '') return DASH
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return asText(value)
  return String(numeric)
}

function formatClock(iso) {
  if (!iso) return DASH
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return DASH
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function titleCaseWords(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/** Display pay method enums (YJEEK_WALLET → Wallet). */
export function formatReportsPayMethod(value) {
  if (value === null || value === undefined || value === '') return DASH
  const raw = String(value).trim().toUpperCase()
  if (raw === 'YJEEK_WALLET' || raw === 'WALLET') return 'Wallet'
  if (raw === 'CARD' || raw === 'CREDIT_CARD') return 'Card'
  if (raw === 'COD' || raw === 'CASH') return 'COD'
  return titleCaseWords(value)
}

/** Display pay status enums (PAID → Paid). */
export function formatReportsPayStatus(value) {
  if (value === null || value === undefined || value === '') return DASH
  return titleCaseWords(value)
}

/**
 * Display order status for the reports table.
 * COMPLETED → Delivered (matches KPI "Delivered" naming).
 */
export function formatReportsOrderStatus(value) {
  if (value === null || value === undefined || value === '') return DASH
  const raw = String(value).trim().toUpperCase()
  if (raw === 'COMPLETED' || raw === 'DELIVERED') return 'Delivered'
  if (raw === 'CANCELLED' || raw === 'CANCELED') return 'Cancelled'
  if (raw === 'REFUNDED') return 'Refunded'
  return titleCaseWords(value)
}

export function formatReportsSla(value) {
  if (value === null || value === undefined || value === '') return DASH
  const raw = String(value).trim().toLowerCase().replace(/\s+/g, '_')
  if (raw === 'on_time' || raw === 'on-time' || raw === 'ontime') return 'On-time'
  if (raw === 'late') return 'Late'
  return titleCaseWords(value)
}

function formatOrderNumber(value) {
  const text = String(value || '').trim()
  if (!text) return DASH
  return text.startsWith('#') ? text : `#${text}`
}

/**
 * Map GET /admin/reports/orders `data` → Reports · Orders UI model.
 *
 * Confirmed KPIs: totalOrders, delivered, cancelled, gmv, aov, onTimePct, avgDeliveryMin, refunds
 * Confirmed pagination: page, limit, total
 * Confirmed orders[] fields from Postman samples.
 */
export function mapAdminOrdersReportResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid orders report response from the server.' })
  }

  const kpis = data.kpis && typeof data.kpis === 'object' ? data.kpis : {}
  const range = data.range && typeof data.range === 'object' ? data.range : {}
  const orders = Array.isArray(data.orders) ? data.orders : []

  const page = Number(data.page)
  const limit = Number(data.limit)
  const total = Number(data.total)

  return {
    range: {
      from: range.from ?? null,
      to: range.to ?? null,
      preset: range.preset ?? null,
    },
    stats: [
      kpis.totalOrders != null
        ? { key: 'totalOrders', label: 'Total orders', value: formatCount(kpis.totalOrders), tone: 'ink' }
        : null,
      kpis.delivered != null
        ? { key: 'delivered', label: 'Delivered', value: formatCount(kpis.delivered), tone: 'green' }
        : null,
      kpis.cancelled != null
        ? { key: 'cancelled', label: 'Cancelled', value: formatCount(kpis.cancelled), tone: 'red' }
        : null,
      kpis.gmv != null
        ? { key: 'gmv', label: 'GMV', value: formatCompactMoney(kpis.gmv), tone: 'green' }
        : null,
      kpis.aov != null
        ? { key: 'aov', label: 'AOV', value: formatMoneyBhd(kpis.aov), tone: 'ink' }
        : null,
      kpis.onTimePct != null
        ? { key: 'onTimePct', label: 'On-time', value: formatPct(kpis.onTimePct), tone: 'green' }
        : null,
      kpis.avgDeliveryMin != null
        ? { key: 'avgDeliveryMin', label: 'Avg delivery', value: formatMinutes(kpis.avgDeliveryMin), tone: 'ink' }
        : null,
      kpis.refunds != null
        ? { key: 'refunds', label: 'Refunds', value: formatCompactMoney(kpis.refunds), tone: 'orange' }
        : null,
    ].filter(Boolean),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    total: Number.isFinite(total) && total >= 0 ? total : orders.length,
    rows: orders.map(mapAdminOrdersReportRow).filter(Boolean),
  }
}

export function mapAdminOrdersReportRow(order) {
  if (!order || typeof order !== 'object') return null

  const timestamps =
    order.timestamps && typeof order.timestamps === 'object' ? order.timestamps : {}
  const id = order.orderNumber || order.orderId || order.id
  if (!id) return null

  const rating =
    order.rating === null || order.rating === undefined || order.rating === ''
      ? DASH
      : String(order.rating)

  return {
    key: String(order.id || id),
    id: formatOrderNumber(id),
    date: asText(order.dateLabel),
    time: asText(order.timeLabel),
    mode: asText(order.mode),
    tier: asText(order.tier),
    customer: asText(order.customerName),
    store: asText(order.storeName),
    branch: asText(order.branchName),
    city: asText(order.city),
    block: asText(order.block),
    champ: asText(order.champName),
    vehicle: asText(order.vehicleType),
    pickupKm: formatKm(order.pickupKm),
    dropoffKm: formatKm(order.dropoffKm),
    totalKm: formatKm(order.totalKm),
    items: order.itemsCount == null || order.itemsCount === '' ? DASH : Number(order.itemsCount),
    value: formatMoneyBhd(order.value),
    payMethod: formatReportsPayMethod(order.payMethod),
    payStatus: formatReportsPayStatus(order.payStatus),
    placed: formatClock(timestamps.placed),
    accepted: formatClock(timestamps.accepted),
    prep: formatClock(timestamps.prep),
    ready: formatClock(timestamps.ready),
    picked: formatClock(timestamps.picked),
    onWay: formatClock(timestamps.onWay),
    delivered: formatClock(timestamps.delivered),
    sla: formatReportsSla(order.sla ?? order.slaKey),
    rating,
    status: formatReportsOrderStatus(order.status),
    rawStatus: order.status ?? null,
  }
}

/**
 * Build query params for GET /admin/reports/orders from UI filter state.
 * Confirmed: preset, page, limit, sort, search, status, sla
 * Sent when set (backend may ignore unknown): mode, vendor, city, champ, payMethod, from, to
 */
export function mapAdminOrdersReportQuery(filters = {}) {
  const params = {}

  const preset = String(filters.preset || '').trim()
  if (preset) params.preset = preset

  const page = Number(filters.page)
  if (Number.isFinite(page) && page > 0) params.page = page

  const limit = Number(filters.limit)
  if (Number.isFinite(limit) && limit > 0) params.limit = limit

  const sort = String(filters.sort || '').trim()
  if (sort) params.sort = sort

  const search = String(filters.search || '').trim()
  params.search = search

  params.status = String(filters.status || 'all').trim() || 'all'
  params.sla = String(filters.sla || 'all').trim() || 'all'

  const mode = String(filters.mode || filters.type || '').trim()
  if (mode && mode !== 'all') params.mode = mode

  const vendor = String(filters.vendor || '').trim()
  if (vendor && vendor !== 'all') params.vendor = vendor

  const city = String(filters.city || filters.zone || '').trim()
  if (city && city !== 'all') params.city = city

  const champ = String(filters.champ || '').trim()
  if (champ && champ !== 'all') params.champ = champ

  const payMethod = String(filters.payMethod || filters.payment || '').trim()
  if (payMethod && payMethod !== 'all') params.payMethod = payMethod

  const from = String(filters.from || '').trim()
  if (from) params.from = from

  const to = String(filters.to || '').trim()
  if (to) params.to = to

  return params
}

/** UI period label → API preset. */
export function mapReportsPeriodToPreset(periodLabel) {
  const label = String(periodLabel || '')
    .replace(/^Period\s*[·:]\s*/i, '')
    .trim()
    .toLowerCase()
  if (label.includes('7')) return '7d'
  if (label.includes('90')) return '90d'
  if (label.includes('year') || label.includes('mtd')) return 'mtd'
  return '30d'
}

/** UI sort label → API sort. */
export function mapReportsSortToApi(sortLabel) {
  const label = String(sortLabel || '')
    .replace(/^Sort:\s*/i, '')
    .trim()
    .toLowerCase()
  if (label.includes('oldest')) return 'oldest'
  if (label.includes('highest')) return 'highest_value'
  if (label.includes('lowest')) return 'lowest_value'
  return 'newest'
}

/** UI status filter → API status query. */
export function mapReportsStatusFilterToApi(uiValue) {
  const raw = String(uiValue || '')
    .replace(/^Status\s*[·:]\s*/i, '')
    .trim()
    .toLowerCase()
  if (!raw || raw === 'all') return 'all'
  if (raw === 'delivered') return 'COMPLETED'
  if (raw === 'cancelled' || raw === 'canceled') return 'CANCELLED'
  if (raw === 'refunded') return 'REFUNDED'
  if (raw === 'confirmed') return 'CONFIRMED'
  if (raw === 'preparing') return 'PREPARING'
  return String(uiValue)
    .replace(/^Status\s*[·:]\s*/i, '')
    .trim()
    .toUpperCase()
}

/** UI SLA filter → API sla query. */
export function mapReportsSlaFilterToApi(uiValue) {
  const raw = String(uiValue || '')
    .replace(/^SLA\s*[·:]\s*/i, '')
    .trim()
    .toLowerCase()
  if (!raw || raw === 'all') return 'all'
  if (raw.includes('on')) return 'on_time'
  if (raw.includes('late')) return 'late'
  return raw.replace(/\s+/g, '_')
}

/** UI payment filter → API payMethod. */
export function mapReportsPaymentFilterToApi(uiValue) {
  const raw = String(uiValue || '')
    .replace(/^Payment\s*[·:]\s*/i, '')
    .trim()
    .toLowerCase()
  if (!raw || raw === 'all') return 'all'
  if (raw === 'wallet') return 'YJEEK_WALLET'
  if (raw === 'card') return 'CARD'
  if (raw === 'cod') return 'COD'
  return String(uiValue).replace(/^Payment\s*[·:]\s*/i, '').trim()
}

/** UI type filter → API mode. */
export function mapReportsTypeFilterToApi(uiValue) {
  const raw = String(uiValue || '')
    .replace(/^Type\s*[·:]\s*/i, '')
    .trim()
  if (!raw || raw.toLowerCase() === 'all') return 'all'
  return raw
}

function stripFilterPrefix(value, prefix) {
  return String(value || '')
    .replace(new RegExp(`^${prefix}\\s*[·:]\\s*`, 'i'), '')
    .trim()
}

export function mapReportsVendorFilterToApi(uiValue) {
  const raw = stripFilterPrefix(uiValue, 'Vendor')
  if (!raw || raw.toLowerCase() === 'all') return 'all'
  return raw
}

export function mapReportsZoneFilterToApi(uiValue) {
  const raw = stripFilterPrefix(uiValue, 'Zone')
  if (!raw || raw.toLowerCase() === 'all') return 'all'
  return raw
}

export function mapReportsChampFilterToApi(uiValue) {
  const raw = stripFilterPrefix(uiValue, 'Champ')
  if (!raw || raw.toLowerCase() === 'all') return 'all'
  return raw
}
