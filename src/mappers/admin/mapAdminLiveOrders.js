import { ApiError } from '../../api/errors'

const COLUMN_META = [
  { id: 'critical', apiKey: 'critical', title: 'Critical', tone: 'red' },
  { id: 'at-risk', apiKey: 'at_risk', title: 'At Risk', tone: 'yellow' },
  { id: 'on-track', apiKey: 'on_track', title: 'On Track', tone: 'green' },
]

/** Map Live Orders column id → API `bucket` query value. */
export function adminLiveOrdersBucketForColumnId(columnId) {
  const match = COLUMN_META.find((column) => column.id === columnId)
  return match?.apiKey || 'all'
}

function mapContactType(tags, champ) {
  if (Array.isArray(tags)) {
    if (tags.includes('Champ')) return 'Champ'
    if (tags.includes('Customer')) return 'Customer'
    if (tags.includes('Vendor')) return 'Vendor'
  }
  if (champ && typeof champ === 'object') return 'Champ'
  return null
}

/**
 * Map one confirmed live-order item into the existing AdminLiveOrderCard shape.
 * @param {Record<string, unknown>} item
 */
export function mapAdminLiveOrderItem(item) {
  if (!item || typeof item !== 'object') return null

  const vendor = item.vendor && typeof item.vendor === 'object' ? item.vendor : null
  const champ = item.champ && typeof item.champ === 'object' ? item.champ : null
  const tags = Array.isArray(item.tags) ? item.tags : []
  const displayId = item.orderNumber || item.id
  if (!displayId) return null

  return {
    id: String(displayId),
    orderId: item.id ?? null,
    bucket: item.bucket ?? null,
    vendor: vendor?.name || '—',
    vendorArea: vendor?.area ?? null,
    vendorId: vendor?.id ?? null,
    temperature: item.category || '—',
    timeLeft: item.timeLeftLabel || (item.elapsedMin != null ? `${item.elapsedMin}m` : '—'),
    elapsedMin: item.elapsedMin ?? null,
    state: item.statusLabel || item.status || '—',
    status: item.status ?? null,
    orderType: item.orderType ?? null,
    fulfillmentType: item.fulfillmentType ?? null,
    slaBreached: Boolean(item.slaBreached),
    hasIncident: Boolean(item.hasIncident),
    incidentCount: Number(item.incidentCount) || 0,
    conversationId: item.conversationId ?? null,
    tags,
    contactType: mapContactType(tags, champ),
    schedule: item.fulfillmentType === 'SCHEDULED' ? 'Scheduled' : null,
    rider: {
      id: champ?.id ?? null,
      name: champ?.name || 'Unassigned',
    },
    priorityLabel: item.priorityLabel ?? null,
  }
}

/**
 * Map confirmed GET /admin/dashboard/orders `data` into Live Orders UI shape.
 * Incidents + chats stay empty until those feeds are confirmed — no mock padding.
 *
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminLiveOrdersResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Invalid live orders response from the server.',
    })
  }

  const counts = data.counts && typeof data.counts === 'object' ? data.counts : {}
  const items = (Array.isArray(data.items) ? data.items : [])
    .map((item) => mapAdminLiveOrderItem(item))
    .filter(Boolean)

  const byBucket = {
    critical: [],
    at_risk: [],
    on_track: [],
  }

  for (const order of items) {
    const key = order.bucket === 'at_risk' || order.bucket === 'on_track' || order.bucket === 'critical'
      ? order.bucket
      : 'critical'
    byBucket[key].push(order)
  }

  return {
    activeOrderCount: Number(counts.all) || items.length,
    refreshIntervalSeconds: null,
    bucket: data.bucket ?? 'all',
    sort: data.sort ?? null,
    filters: [],
    columns: COLUMN_META.map((column) => ({
      id: column.id,
      title: column.title,
      tone: column.tone,
      count: Number(counts[column.apiKey]) || byBucket[column.apiKey].length,
      orders: byBucket[column.apiKey],
    })),
    incidents: [],
    chats: [],
  }
}
