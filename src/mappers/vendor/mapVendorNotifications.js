/**
 * Map confirmed Vendor notifications API payloads into the Notifications UI shape.
 *
 * Confirmed list item fields (Postman GET /vendor-panel/notifications):
 *   id, vendorId, vendorLocationId, orderId, type, title, body,
 *   metadata, isRead, createdAt
 */

const TYPE_VISUALS = {
  NEW_ORDER: { icon: '🔔', iconBg: '#FFF4CC' },
  ORDER_RECEIVED: { icon: '🔔', iconBg: '#FFF4CC' },
  ACCEPTANCE_SLA_BREACH: { icon: '🚨', iconBg: '#FDECEC' },
  PREPARATION_DELAY: { icon: '⏱️', iconBg: '#FFF2D6' },
  PREP_DELAY: { icon: '⏱️', iconBg: '#FFF2D6' },
  CHAMP_WAITING: { icon: '🛵', iconBg: '#FFF4CC' },
  CHAMP_WAITING_TOO_LONG: { icon: '🛵', iconBg: '#FFF4CC' },
  CUSTOMER_CANCELLED: { icon: '🚫', iconBg: '#FDECEC' },
  ORDER_CANCELLED: { icon: '🚫', iconBg: '#FDECEC' },
}

const DEFAULT_VISUAL = { icon: '🔔', iconBg: '#EEF2EE' }

function isUiShapedNotification(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.section === 'string' &&
    typeof item.unread === 'boolean' &&
    typeof item.icon === 'string'
  )
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatRelativeTime(iso, now = new Date()) {
  if (!iso) return ''
  const created = new Date(iso)
  if (Number.isNaN(created.getTime())) return ''

  const diffMs = Math.max(0, now.getTime() - created.getTime())
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return 'just now'

  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`

  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`

  return created.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function resolveSection(iso, now = new Date()) {
  if (!iso) return 'earlier'
  const created = new Date(iso)
  if (Number.isNaN(created.getTime())) return 'earlier'
  return startOfLocalDay(created).getTime() === startOfLocalDay(now).getTime() ? 'today' : 'earlier'
}

function resolveVisual(type) {
  const key = String(type || '')
    .trim()
    .toUpperCase()
  return TYPE_VISUALS[key] || DEFAULT_VISUAL
}

/**
 * Map one notification into the existing Notifications list-row shape.
 */
export function mapVendorNotification(item, now = new Date()) {
  if (!item || typeof item !== 'object') return null

  if (isUiShapedNotification(item)) {
    return {
      ...item,
      id: item.id,
      title: item.title,
      body: item.body,
      time: item.time,
      unread: Boolean(item.unread),
      highlight: item.highlight ?? Boolean(item.unread),
      icon: item.icon,
      iconBg: item.iconBg || DEFAULT_VISUAL.iconBg,
      section: item.section,
      type: item.type ?? null,
      orderId: item.orderId ?? null,
      metadata: item.metadata ?? null,
      createdAt: item.createdAt ?? null,
    }
  }

  const unread = item.isRead === false || item.isRead === 0 || item.unread === true
  const visual = resolveVisual(item.type)

  return {
    id: item.id,
    title: item.title || 'Notification',
    body: item.body || '',
    time: formatRelativeTime(item.createdAt, now),
    unread,
    highlight: unread,
    icon: visual.icon,
    iconBg: visual.iconBg,
    section: resolveSection(item.createdAt, now),
    type: item.type ?? null,
    orderId: item.orderId ?? null,
    vendorLocationId: item.vendorLocationId ?? null,
    metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata : null,
    createdAt: item.createdAt ?? null,
    isRead: !unread,
  }
}

/**
 * Map GET /vendor-panel/notifications `data` into a UI list array.
 * Accepts `{ items: [...] }`, a raw array, or already UI-shaped rows.
 */
export function mapVendorNotificationsResponse(data, now = new Date()) {
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.notifications)
        ? data.notifications
        : []

  return rawItems.map((item) => mapVendorNotification(item, now)).filter(Boolean)
}

/**
 * Map GET /vendor-panel/notifications/unread-count `data` into a number.
 * Accepts `{ count }`, `{ unreadCount }`, or a bare number.
 */
export function mapVendorUnreadCountResponse(data) {
  if (typeof data === 'number' && Number.isFinite(data)) return Math.max(0, Math.floor(data))
  if (!data || typeof data !== 'object') return 0

  const raw = data.count ?? data.unreadCount ?? data.unread ?? 0
  const numeric = Number(raw)
  if (Number.isNaN(numeric)) return 0
  return Math.max(0, Math.floor(numeric))
}
