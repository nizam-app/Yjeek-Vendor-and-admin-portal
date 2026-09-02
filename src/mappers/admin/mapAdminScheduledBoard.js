import { ApiError } from '../../api/errors'

/** Pipeline columns used by Scheduled Orders UI. */
export const ADMIN_SCHEDULED_PIPELINE_COLUMNS = [
  { key: 'new', title: 'New', tone: '#20b665' },
  { key: 'response', title: 'Awaiting champ response', tone: '#dfa52b' },
  { key: 'confirmation', title: 'Awaiting champ confirmation', tone: '#dfa52b' },
  { key: 'confirmed', title: 'Confirmed', tone: '#20b665' },
]

/** API `pipelineColumn` → UI column key */
const PIPELINE_COLUMN_BY_API = {
  new: 'new',
  awaiting_champ_response: 'response',
  awaiting_champ_confirmation: 'confirmation',
  confirmed: 'confirmed',
}

const ACTION_UI = {
  ASSIGN_DATE_TIME_CHAMP: { label: 'Assign date · time · champ', tone: 'green' },
  REMIND_CHAMP: { label: 'Remind champ', tone: null },
  REASSIGN_CHAMP: { label: 'Reassign champ', tone: 'red' },
  FORCE_PICKUP_NOW: { label: 'Force pickup now', tone: null, footer: true },
}

/**
 * Heuristic fallback when `pipelineColumn` is missing.
 * Prefer API `pipelineColumn` — do not invent columns when the field is present.
 *
 * @param {string|null|undefined} status
 * @param {{ id?: unknown, name?: unknown }|null} champ
 */
export function mapAdminScheduledPipelineColumn(status, champ) {
  const hasChamp = Boolean(champ && (champ.id || champ.name))

  switch (status) {
    case 'PENDING_VENDOR_ACCEPT':
    case 'PLACED':
    case 'AWAITING_PAYMENT':
      return 'new'
    case 'SEARCHING_DRIVER':
      return 'response'
    case 'AWAITING_DRIVER_CONFIRM':
      return 'confirmation'
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

/**
 * Resolve UI column from confirmed API `pipelineColumn`, with status heuristic fallback.
 * @param {Record<string, unknown>} item
 * @param {{ id?: unknown, name?: unknown }|null} champ
 */
export function resolveAdminScheduledColumn(item, champ) {
  const raw = item?.pipelineColumn != null ? String(item.pipelineColumn) : ''
  if (raw && PIPELINE_COLUMN_BY_API[raw]) return PIPELINE_COLUMN_BY_API[raw]
  // Accept UI keys if API already sends them
  if (ADMIN_SCHEDULED_PIPELINE_COLUMNS.some((column) => column.key === raw)) return raw
  return mapAdminScheduledPipelineColumn(item?.status, champ)
}

function mapTags(item) {
  if (Array.isArray(item.tags) && item.tags.length > 0) {
    return item.tags.map((tag) => String(tag))
  }
  if (item.category) return [String(item.category)]
  return ['Normal']
}

function mapActions(item, column, statusLabel, banner) {
  const codes = Array.isArray(item.actions) ? item.actions.map(String) : []
  const failed =
    (banner && String(banner.tone || '').toLowerCase() === 'danger')
    || /expired|declined/i.test(String(statusLabel || ''))

  let primaryCode = null
  if (codes.includes('ASSIGN_DATE_TIME_CHAMP')) {
    primaryCode = 'ASSIGN_DATE_TIME_CHAMP'
  } else if (failed && codes.includes('REASSIGN_CHAMP')) {
    primaryCode = 'REASSIGN_CHAMP'
  } else if (codes.includes('REMIND_CHAMP')) {
    primaryCode = 'REMIND_CHAMP'
  } else if (codes.includes('REASSIGN_CHAMP')) {
    primaryCode = 'REASSIGN_CHAMP'
  } else {
    primaryCode = codes.find((code) => ACTION_UI[code] && !ACTION_UI[code].footer) || null
  }

  const primary = primaryCode ? ACTION_UI[primaryCode] : null
  const forcePickup = codes.includes('FORCE_PICKUP_NOW') ? ACTION_UI.FORCE_PICKUP_NOW : null

  // Legacy heuristic when actions[] is empty
  if (!primary && !forcePickup && codes.length === 0) {
    if (column === 'new') {
      return {
        actions: [],
        action: 'Assign date · time · champ',
        actionTone: 'green',
        actionCode: 'ASSIGN_DATE_TIME_CHAMP',
        footer: null,
      }
    }
    return { actions: [], action: null, actionTone: null, actionCode: null, footer: null }
  }

  return {
    actions: codes,
    action: primary?.label || null,
    actionTone: primary?.tone || null,
    actionCode: primaryCode,
    footer: forcePickup?.label || null,
  }
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
  const column = resolveAdminScheduledColumn(item, champ)
  const champName = champ?.name ? String(champ.name) : null
  const vendorName = vendor?.name || '—'
  const area = vendor?.area ? String(vendor.area) : ''
  const route = vendor?.label
    ? String(vendor.label).replace(' · ', ' → ')
    : area
      ? `${vendorName} → ${area}`
      : vendorName

  const banner = item.banner && typeof item.banner === 'object' ? item.banner : null
  const bannerText = banner?.text ? String(banner.text) : null
  const bannerTone = banner?.tone ? String(banner.tone) : null

  const mappedActions = mapActions(item, column, statusLabel, banner)

  let timer = null
  if (bannerText) {
    timer = bannerText
  } else if (item.timeLeftLabel) {
    timer = String(item.timeLeftLabel)
  }

  return {
    id: String(displayId),
    orderId: item.id ?? null,
    tags: mapTags(item),
    payment: String(statusLabel),
    route,
    column,
    pipelineColumn: item.pipelineColumn != null ? String(item.pipelineColumn) : null,
    champ: champName,
    champId: champ?.id ? String(champ.id) : null,
    slot: item.windowLabel ? String(item.windowLabel) : null,
    action: mappedActions.action,
    actionTone: mappedActions.actionTone,
    actionCode: mappedActions.actionCode,
    actions: mappedActions.actions,
    footer: mappedActions.footer,
    timer,
    bannerTone,
    status,
    statusLabel: String(statusLabel),
    bucket: item.bucket ?? null,
    category: item.category ?? null,
    priorityLabel: item.priorityLabel ?? null,
    deliverySpeedLabel: item.deliverySpeedLabel ?? null,
    deliverySpeed: item.deliverySpeed ?? null,
    windowStartAt: item.windowStartAt ?? null,
    windowEndAt: item.windowEndAt ?? null,
    elapsedMin: item.elapsedMin ?? null,
    timeLeftLabel: item.timeLeftLabel ?? null,
    orderType: item.orderType ?? null,
    fulfillmentType: item.fulfillmentType ?? null,
    slaBreached: Boolean(item.slaBreached),
    hasIncident: Boolean(item.hasIncident),
    incidentCount: Number(item.incidentCount) || 0,
    conversationId: item.conversationId ?? item.customerConversationId ?? item.driverConversationId ?? null,
    customerConversationId: item.customerConversationId ?? null,
    driverConversationId: item.driverConversationId ?? null,
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
  const pipelineCounts =
    data.pipelineCounts && typeof data.pipelineCounts === 'object' ? data.pipelineCounts : null
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
    pipelineCounts: pipelineCounts
      ? {
          new: Number(pipelineCounts.new) || 0,
          awaiting_champ_response: Number(pipelineCounts.awaiting_champ_response) || 0,
          awaiting_champ_confirmation: Number(pipelineCounts.awaiting_champ_confirmation) || 0,
          confirmed: Number(pipelineCounts.confirmed) || 0,
        }
      : null,
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
