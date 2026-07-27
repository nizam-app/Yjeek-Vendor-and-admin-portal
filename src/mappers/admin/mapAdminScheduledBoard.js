import { ApiError } from '../../api/errors'

/** Pipeline columns used by Scheduled Orders UI (not returned by the board API). */
export const ADMIN_SCHEDULED_PIPELINE_COLUMNS = [
  { key: 'new', title: 'New', tone: '#20b665' },
  { key: 'response', title: 'Awaiting champ response', tone: '#dfa52b' },
  { key: 'confirmation', title: 'Awaiting champ confirmation', tone: '#dfa52b' },
  { key: 'confirmed', title: 'Confirmed', tone: '#20b665' },
]

/**
 * Heuristic pipeline column from confirmed status codes.
 * The board API returns SLA `bucket` (critical/at_risk/on_track), not pipeline stages.
 *
 * @param {string|null|undefined} status
 * @param {{ id?: unknown, name?: unknown }|null} champ
 */
export function mapAdminScheduledPipelineColumn(status, champ) {
  const hasChamp = Boolean(champ && (champ.id || champ.name))

  switch (status) {
    case 'PENDING_VENDOR_ACCEPT':
    case 'PLACED':
      return 'new'
    case 'PREPARING':
    case 'READY_FOR_PICKUP':
    case 'ON_THE_WAY':
    case 'OUT_FOR_DELIVERY':
    case 'PICKED_UP':
      return 'confirmed'
    case 'CONFIRMED':
    case 'VENDOR_ACCEPTED':
      return hasChamp ? 'response' : 'new'
    default:
      return 'new'
  }
}

function mapTags(item) {
  if (Array.isArray(item.tags) && item.tags.length > 0) {
    return item.tags.map((tag) => String(tag))
  }
  if (item.category) return [String(item.category)]
  return ['Normal']
}

/**
 * Map one scheduled-board item into OrderCard / column-card shape.
 * @param {Record<string, unknown>} item
 */
export function mapAdminScheduledBoardItem(item) {
  if (!item || typeof item !== 'object') return null

  const vendor = item.vendor && typeof item.vendor === 'object' ? item.vendor : null
  const champ = item.champ && typeof item.champ === 'object' ? item.champ : null
  const displayId = item.orderNumber || item.id
  if (!displayId) return null

  const status = item.status ?? null
  const statusLabel = item.statusLabel || status || '—'
  const column = mapAdminScheduledPipelineColumn(status, champ)
  const champName = champ?.name ? String(champ.name) : null
  const vendorName = vendor?.name || '—'
  const area = vendor?.area ? String(vendor.area) : ''
  const route = area ? `${vendorName} → ${area}` : vendorName

  let action = null
  let actionTone = null
  let timer = null

  if (column === 'new' && status === 'PENDING_VENDOR_ACCEPT') {
    if (item.timeLeftLabel) timer = `⌛ ${item.timeLeftLabel}`
  } else if (column === 'new' && !champName) {
    action = 'Assign date · time · champ'
    actionTone = 'green'
  } else if (column === 'response' && champName) {
    action = 'Remind champ'
  }

  return {
    id: String(displayId),
    orderId: item.id ?? null,
    tags: mapTags(item),
    payment: String(statusLabel),
    route,
    column,
    champ: champName,
    action,
    actionTone,
    timer,
    status,
    statusLabel: String(statusLabel),
    bucket: item.bucket ?? null,
    category: item.category ?? null,
    priorityLabel: item.priorityLabel ?? null,
    elapsedMin: item.elapsedMin ?? null,
    timeLeftLabel: item.timeLeftLabel ?? null,
    orderType: item.orderType ?? null,
    fulfillmentType: item.fulfillmentType ?? null,
    slaBreached: Boolean(item.slaBreached),
    hasIncident: Boolean(item.hasIncident),
    incidentCount: Number(item.incidentCount) || 0,
    conversationId: item.conversationId ?? null,
    vendorId: vendor?.id ?? null,
    vendorName,
    vendorArea: area || null,
  }
}

/**
 * Map confirmed GET /admin/dashboard/boards/scheduled `data` into Scheduled pipeline UI shape.
 * Incidents + chats stay empty until those feeds are confirmed — no mock padding.
 *
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminScheduledBoardResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Invalid scheduled board response from the server.',
    })
  }

  const counts = data.counts && typeof data.counts === 'object' ? data.counts : {}
  const orders = (Array.isArray(data.items) ? data.items : [])
    .map((item) => mapAdminScheduledBoardItem(item))
    .filter(Boolean)

  return {
    board: data.board ?? 'scheduled',
    counts: {
      critical: Number(counts.critical) || 0,
      at_risk: Number(counts.at_risk) || 0,
      on_track: Number(counts.on_track) || 0,
      all: Number(counts.all) || orders.length,
    },
    bucket: data.bucket ?? 'all',
    sort: data.sort ?? null,
    columns: ADMIN_SCHEDULED_PIPELINE_COLUMNS.map((column) => ({
      key: column.key,
      title: column.title,
      tone: column.tone,
    })),
    orders,
    incidents: [],
    chats: [],
  }
}
