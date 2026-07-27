import { ApiError } from '../../api/errors'

function mapPeerRole(peerRole) {
  switch (String(peerRole || '').toUpperCase()) {
    case 'CUSTOMER':
      return 'Customer'
    case 'CHAMP':
      return 'Champ'
    case 'VENDOR':
      return 'Vendor'
    default:
      if (!peerRole) return '—'
      const raw = String(peerRole)
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
  }
}

/** Initials for avatar from peer display name. */
export function initialsFromPeerName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/**
 * Map one confirmed open-chat item into AdminOpenChats / ChatStrip shape.
 * @param {Record<string, unknown>} item
 */
export function mapAdminChatItem(item) {
  if (!item || typeof item !== 'object') return null

  const conversationId = item.conversationId || item.id
  if (!conversationId) return null

  const peerName = item.peerName ? String(item.peerName) : '—'
  const role = mapPeerRole(item.peerRole)

  return {
    id: String(conversationId),
    conversationId: String(conversationId),
    orderId: item.orderId ?? null,
    orderNumber: item.orderNumber ? String(item.orderNumber) : null,
    name: peerName,
    role,
    peerRole: item.peerRole ? String(item.peerRole) : null,
    message: item.lastMessage ? String(item.lastMessage) : '',
    lastMessageAt: item.lastMessageAt ?? null,
    unreadCount: Number(item.unread) || 0,
    initials: initialsFromPeerName(peerName),
  }
}

/**
 * Map confirmed GET /admin/dashboard/chats `data`.
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminChatsResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Invalid open chats response from the server.',
    })
  }

  const items = (Array.isArray(data.items) ? data.items : [])
    .map((item) => mapAdminChatItem(item))
    .filter(Boolean)

  return {
    active: Number(data.active) || items.length,
    items,
  }
}
