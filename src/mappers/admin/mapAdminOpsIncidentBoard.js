import { ApiError } from '../../api/errors'

/**
 * Shared Incident / On Track board mapper for Admin ops boards
 * (pickup, dine_in, services) that share the same API item shape.
 *
 * API buckets: critical / at_risk / on_track — Incident folds critical + at_risk.
 */
const COLUMN_META = [
  { id: 'incident', title: 'Incident', tone: 'red' },
  { id: 'on-track', title: 'On Track', tone: 'green' },
]

/**
 * Map one ops-board item into AdminIncidentCard shape.
 * @param {Record<string, unknown>} item
 */
export function mapAdminOpsIncidentBoardItem(item) {
  if (!item || typeof item !== 'object') return null

  const vendor = item.vendor && typeof item.vendor === 'object' ? item.vendor : null
  const champ = item.champ && typeof item.champ === 'object' ? item.champ : null
  const displayId = item.orderNumber || item.id
  if (!displayId) return null

  const statusLabel = item.statusLabel || item.status || '—'
  const champName = champ?.name ? String(champ.name) : 'Unassigned'

  return {
    id: String(displayId),
    orderId: item.id ?? null,
    bucket: item.bucket ?? null,
    vendor: vendor?.name || '—',
    vendorArea: vendor?.area ?? null,
    vendorId: vendor?.id ?? null,
    timeLeft: item.timeLeftLabel || (item.elapsedMin != null ? `${item.elapsedMin}m` : '—'),
    elapsedMin: item.elapsedMin ?? null,
    detail: `${statusLabel} · ${champName}`,
    status: item.status ?? null,
    statusLabel: String(statusLabel),
    category: item.category ?? null,
    priorityLabel: item.priorityLabel ?? null,
    orderType: item.orderType ?? null,
    fulfillmentType: item.fulfillmentType ?? null,
    slaBreached: Boolean(item.slaBreached),
    hasIncident: Boolean(item.hasIncident),
    incidentCount: Number(item.incidentCount) || 0,
    conversationId: item.conversationId ?? null,
    tags: Array.isArray(item.tags) ? item.tags : [],
    champ: champ
      ? { id: champ.id ?? null, name: champ.name ? String(champ.name) : null }
      : null,
  }
}

function columnForBucket(bucket) {
  if (bucket === 'on_track') return 'on-track'
  return 'incident'
}

/**
 * @param {Record<string, unknown>|null|undefined} data
 * @param {{ board?: string, activeLabel: string, invalidMessage?: string }} options
 */
export function mapAdminOpsIncidentBoardResponse(data, options) {
  const board = options?.board || 'board'
  const activeLabel = options?.activeLabel || 'active orders'
  const invalidMessage = options?.invalidMessage || 'Invalid board response from the server.'

  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: invalidMessage })
  }

  const counts = data.counts && typeof data.counts === 'object' ? data.counts : {}
  const items = (Array.isArray(data.items) ? data.items : [])
    .map((item) => mapAdminOpsIncidentBoardItem(item))
    .filter(Boolean)

  const byColumn = {
    incident: [],
    'on-track': [],
  }

  for (const order of items) {
    byColumn[columnForBucket(order.bucket)].push(order)
  }

  const incidentCount =
    (Number(counts.critical) || 0) + (Number(counts.at_risk) || 0) || byColumn.incident.length
  const onTrackCount = Number(counts.on_track) || byColumn['on-track'].length

  return {
    board: data.board ?? board,
    activeCount: Number(counts.all) || items.length,
    activeLabel,
    refreshIntervalSeconds: null,
    bucket: data.bucket ?? 'all',
    sort: data.sort ?? null,
    filters: [],
    columns: COLUMN_META.map((column) => ({
      id: column.id,
      title: column.title,
      tone: column.tone,
      count: column.id === 'incident' ? incidentCount : onTrackCount,
      orders: byColumn[column.id],
    })),
    incidents: [],
    chats: [],
  }
}
