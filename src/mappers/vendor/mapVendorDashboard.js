import { ApiError } from '../../api/errors'

function formatDelta(changePercent) {
  if (changePercent === null || changePercent === undefined) return null
  const numeric = Number(changePercent)
  if (Number.isNaN(numeric)) return null
  const sign = numeric > 0 ? '+' : ''
  return `${sign}${numeric}% vs prev`
}

function formatRevenueValue(value) {
  if (value === null || value === undefined) return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return '—'
  return numeric.toFixed(3)
}

function formatCountValue(value) {
  if (value === null || value === undefined) return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return '—'
  return String(numeric)
}

function formatAcceptanceValue(value) {
  if (value === null || value === undefined) return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return '—'
  return `${numeric.toFixed(1)}%`
}

function formatPrepValue(value) {
  if (value === null || value === undefined) return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return '—'
  return `${numeric} min`
}

/**
 * Map confirmed KPI object into the existing Dashboard card list shape.
 * @param {Record<string, { value?: unknown, previous?: unknown, changePercent?: unknown }>|null|undefined} kpis
 * @param {string} [rangeLabel]
 */
export function mapVendorDashboardKpis(kpis, rangeLabel = 'Day') {
  if (!kpis || typeof kpis !== 'object') return []

  const revenueLabel = rangeLabel === 'Day' ? 'Revenue (Day)' : `Revenue (${rangeLabel})`

  return [
    {
      label: revenueLabel,
      value: formatRevenueValue(kpis.revenue?.value),
      prefix: 'BHD',
      delta: formatDelta(kpis.revenue?.changePercent),
    },
    {
      label: 'Completed',
      value: formatCountValue(kpis.completed?.value),
      delta: formatDelta(kpis.completed?.changePercent),
    },
    {
      label: 'Active Now',
      value: formatCountValue(kpis.active?.value),
      delta: formatDelta(kpis.active?.changePercent),
    },
    {
      label: 'Rejected',
      value: formatCountValue(kpis.rejected?.value),
      delta: formatDelta(kpis.rejected?.changePercent),
    },
    {
      label: 'Cancelled',
      value: formatCountValue(kpis.cancelled?.value),
      delta: formatDelta(kpis.cancelled?.changePercent),
    },
    {
      label: 'Acceptance',
      value: formatAcceptanceValue(kpis.acceptanceRate?.value),
      delta: formatDelta(kpis.acceptanceRate?.changePercent),
    },
    {
      label: 'Avg Prep',
      value: formatPrepValue(kpis.avgPrepTimeMin?.value),
      delta: formatDelta(kpis.avgPrepTimeMin?.changePercent),
    },
  ]
}

/**
 * Revenue chart point item shape is not confirmed when points are empty.
 * Pass through UI-shaped mock points; otherwise return [].
 */
function mapRevenueDays(revenueChart) {
  const points = Array.isArray(revenueChart?.points) ? revenueChart.points : []
  if (points.length === 0) return []

  if (points.every((point) => point && 'day' in point && 'height' in point)) {
    return points.map((point) => ({ day: point.day, height: point.height }))
  }

  // Unconfirmed backend point fields — keep empty until a non-empty sample is documented.
  return []
}

/**
 * Top-seller item — confirmed from dashboard Postman sample.
 * API: rank, productId, name, quantitySold, revenue, imageUrl
 * UI: name, sold
 */
function mapTopSellers(items) {
  if (!Array.isArray(items) || items.length === 0) return []

  return items
    .map((item, index) => {
      if (!item || typeof item !== 'object' || typeof item.name !== 'string') return null

      // Legacy / mock UI shape
      if ('sold' in item) {
        return {
          name: item.name,
          sold: item.sold,
          rank: item.rank ?? index + 1,
          productId: item.productId ?? null,
        }
      }

      // Confirmed API shape
      if ('quantitySold' in item || 'revenue' in item || item.productId) {
        const soldRaw = item.quantitySold ?? item.sold
        const soldNumeric = Number(soldRaw)
        return {
          name: item.name,
          sold: Number.isNaN(soldNumeric) ? soldRaw ?? 0 : soldNumeric,
          rank: typeof item.rank === 'number' ? item.rank : index + 1,
          productId: item.productId ?? null,
          revenue: item.revenue ?? null,
          imageUrl: item.imageUrl ?? null,
        }
      }

      return null
    })
    .filter(Boolean)
}

/**
 * Recent-order item — confirmed from dashboard Postman sample.
 * API: orderNumber, orderType, status, branch (string), totalAmount, customer, createdAt
 * UI: id, type, status, branch, total
 */
function mapRecentOrders(items) {
  if (!Array.isArray(items) || items.length === 0) return []

  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null

      // Legacy / mock UI shape
      if ('type' in item && 'total' in item && typeof item.branch === 'string') {
        return {
          id: item.id,
          type: item.type,
          status: item.status,
          branch: item.branch,
          total: item.total,
        }
      }

      // Confirmed API shape
      if (item.orderNumber || item.id) {
        const orderType = String(item.orderType || item.type || '')
          .trim()
          .toLowerCase()
          .replace(/_/g, ' ')
        const typeLabel = orderType
          ? orderType.replace(/\b\w/g, (c) => c.toUpperCase())
          : '—'

        const statusRaw = String(item.status || '').trim()
        const statusLabel = statusRaw
          ? statusRaw
              .toLowerCase()
              .split('_')
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ')
          : '—'

        const totalValue = item.totalAmount ?? item.total
        let total = '—'
        if (typeof totalValue === 'string' && totalValue) {
          total = /bhd/i.test(totalValue) ? totalValue : `${totalValue} BHD`
        } else if (totalValue !== null && totalValue !== undefined && totalValue !== '') {
          const numeric = Number(totalValue)
          total = Number.isNaN(numeric) ? String(totalValue) : `${numeric.toFixed(3)} BHD`
        }

        return {
          id: item.orderNumber || item.id,
          backendId: item.id ?? null,
          type: typeLabel,
          status: statusLabel,
          branch: typeof item.branch === 'string' ? item.branch : item.branch?.name || '—',
          total,
          customer: item.customer ?? null,
          createdAt: item.createdAt ?? null,
        }
      }

      return null
    })
    .filter(Boolean)
}

function isUiShapedDashboard(data) {
  return Array.isArray(data?.kpis)
}

/**
 * Normalize Vendor dashboard API (or mock UI-shaped) payload for Dashboard.jsx.
 *
 * @param {object|null|undefined} data
 * @param {{ rangeLabel?: string }} [options]
 */
export function mapVendorDashboardResponse(data, options = {}) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid dashboard response from the server.' })
  }

  const rangeLabel = options.rangeLabel || 'Day'

  if (isUiShapedDashboard(data)) {
    return {
      kpis: data.kpis,
      revenueDays: Array.isArray(data.revenueDays) ? data.revenueDays : [],
      topSellers: Array.isArray(data.topSellers) ? data.topSellers : [],
      recentOrders: Array.isArray(data.recentOrders) ? data.recentOrders : [],
      period: data.period ?? null,
      previousPeriod: data.previousPeriod ?? null,
      revenueChart: data.revenueChart ?? null,
    }
  }

  return {
    kpis: mapVendorDashboardKpis(data.kpis, rangeLabel),
    revenueDays: mapRevenueDays(data.revenueChart),
    topSellers: mapTopSellers(data.topSellers),
    recentOrders: mapRecentOrders(data.recentOrders),
    period: data.period ?? null,
    previousPeriod: data.previousPeriod ?? null,
    revenueChart: data.revenueChart
      ? {
          granularity: data.revenueChart.granularity ?? null,
          points: Array.isArray(data.revenueChart.points) ? data.revenueChart.points : [],
        }
      : null,
  }
}
