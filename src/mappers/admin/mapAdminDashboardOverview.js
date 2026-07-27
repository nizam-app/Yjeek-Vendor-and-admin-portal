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
  { key: 'critical', title: 'Critical', tone: 'red' },
  { key: 'at_risk', title: 'At Risk', tone: 'yellow' },
  { key: 'on_track', title: 'On Track', tone: 'green' },
]

/**
 * Map confirmed Admin dashboard overview `data` into the existing UI shape.
 *
 * Confirmed from overview: region, kpis, activeOrders, buckets, openIncidents, autoRefreshSeconds.
 * Unconfirmed sections (incidents list, bucket order cards) stay empty — no mock padding.
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
