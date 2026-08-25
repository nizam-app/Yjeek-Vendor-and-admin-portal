import { ApiError } from '../../api/errors'

function formatCount(value) {
  if (value === null || value === undefined) return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return '—'
  return String(numeric)
}

/** Confirmed KPI keys → existing Admin dashboard strip labels. */
const KPI_STRIP = [
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'pickedUp', label: 'Picked up' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled', tone: 'red' },
  { key: 'onlineVendor', label: 'Online Vendor' },
  { key: 'onlineChamp', label: 'Online Champ' },
]

const BUCKET_COLUMNS = [
  { key: 'critical', title: 'Critical', tone: 'red', columnId: 'critical' },
  { key: 'at_risk', title: 'At Risk', tone: 'yellow', columnId: 'at-risk' },
  { key: 'on_track', title: 'On Track', tone: 'green', columnId: 'on-track' },
]

/**
 * Map a live-order board item into the Full Overview bucket card shape.
 */
export function mapAdminOverviewBucketOrderCard(order) {
  if (!order) return null
  const detail = [order.vendor, order.vendorArea, order.temperature, order.state]
    .filter((part) => part && part !== '—')
    .join(' · ')

  return {
    id: order.id,
    orderId: order.orderId || null,
    timeLeft: order.timeLeft || '—',
    detail: detail || '—',
    hasIncident: Boolean(order.hasIncident),
  }
}

/**
 * Attach recent live-order previews (max `limit` each) onto overview slaColumns.
 * Source: GET /admin/dashboard/orders per bucket (same as Live Orders).
 */
export function attachOverviewBucketOrderPreviews(overview, liveByBucket = {}, limit = 2) {
  if (!overview || typeof overview !== 'object') return overview

  const columns = Array.isArray(overview.slaColumns) ? overview.slaColumns : []

  return {
    ...overview,
    slaColumns: columns.map((column) => {
      const meta = BUCKET_COLUMNS.find((item) => item.title === column.title)
      if (!meta) return { ...column, orders: Array.isArray(column.orders) ? column.orders : [] }

      const live = liveByBucket[meta.key]
      const liveColumns = Array.isArray(live?.columns) ? live.columns : []
      const matched =
        liveColumns.find((col) => col.id === meta.columnId) ||
        liveColumns.find((col) => Array.isArray(col.orders) && col.orders.length > 0) ||
        null

      const orders = Array.isArray(matched?.orders)
        ? matched.orders
        : liveColumns.flatMap((col) => (Array.isArray(col.orders) ? col.orders : []))

      return {
        ...column,
        orders: orders
          .slice(0, limit)
          .map(mapAdminOverviewBucketOrderCard)
          .filter(Boolean),
      }
    }),
  }
}

/**
 * Map confirmed Admin dashboard overview `data` into the existing UI shape.
 *
 * Confirmed from overview: region, kpis, activeOrders, buckets, openIncidents, autoRefreshSeconds.
 * Bucket order cards are attached from GET /admin/dashboard/orders in dashboardService.
 *
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminDashboardOverviewResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Invalid dashboard overview response from the server.',
    })
  }

  const kpis = data.kpis && typeof data.kpis === 'object' ? data.kpis : {}
  const buckets = data.buckets && typeof data.buckets === 'object' ? data.buckets : {}

  return {
    region: typeof data.region === 'string' ? data.region : null,
    activeOrders: data.activeOrders ?? null,
    openIncidents: data.openIncidents ?? null,
    autoRefreshSeconds:
      data.autoRefreshSeconds === null || data.autoRefreshSeconds === undefined
        ? null
        : Number(data.autoRefreshSeconds),
    summary: KPI_STRIP.map(({ key, label, tone }) => ({
      key,
      value: formatCount(kpis[key]),
      label,
      ...(tone ? { tone } : {}),
    })),
    incidents: [],
    slaColumns: BUCKET_COLUMNS.map(({ key, title, tone }) => ({
      title,
      tone,
      count: Number(buckets[key]) || 0,
      orders: [],
    })),
  }
}
