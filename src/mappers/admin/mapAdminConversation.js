import { ApiError } from '../../api/errors'
import { initialsFromPeerName } from './mapAdminChats'

/**
 * Map one confirmed conversation message into chat bubble shape.
 * @param {Record<string, unknown>} item
 */
export function mapAdminChatMessage(item) {
  if (!item || typeof item !== 'object') return null
  if (!item.body && !item.id) return null

  const senderRole = item.senderRole ? String(item.senderRole).toUpperCase() : ''
  const own = senderRole === 'ADMIN'

  return {
    id: item.id ? String(item.id) : `msg-${item.createdAt || Date.now()}`,
    text: item.body != null ? String(item.body) : '',
    body: item.body != null ? String(item.body) : '',
    senderRole: senderRole || null,
    senderId: item.senderId ?? null,
    createdAt: item.createdAt ?? null,
    time: item.timeLabel ? String(item.timeLabel) : '',
    own,
  }
}

/**
 * Map confirmed GET /admin/chats/:conversationId `data`.
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminConversationResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Invalid conversation response from the server.',
    })
  }

  const customer =
    data.customer && typeof data.customer === 'object'
      ? {
          id: data.customer.id ? String(data.customer.id) : null,
          name: data.customer.name ? String(data.customer.name) : null,
        }
      : null

  const champ =
    data.champ && typeof data.champ === 'object'
      ? {
          id: data.champ.id ? String(data.champ.id) : null,
          name: data.champ.name ? String(data.champ.name) : null,
        }
      : null

  const messages = (Array.isArray(data.messages) ? data.messages : [])
    .map((item) => mapAdminChatMessage(item))
    .filter(Boolean)

  return {
    id: data.id ? String(data.id) : null,
    conversationId: data.id ? String(data.id) : null,
    orderId: data.orderId ?? null,
    orderNumber: data.orderNumber ? String(data.orderNumber) : null,
    orderStatus: data.orderStatus ? String(data.orderStatus) : null,
    vendorName: data.vendorName ? String(data.vendorName) : null,
    customer,
    champ,
    messages,
  }
}

/**
 * Map confirmed POST send-message `data` into a bubble.
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminSentChatMessage(data) {
  const mapped = mapAdminChatMessage(data)
  if (!mapped) {
    throw new ApiError({ message: 'Invalid send-message response from the server.' })
  }
  return mapped
}

/**
 * Map confirmed POST mark-read `data`.
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminChatReadResponse(data) {
  if (!data || typeof data !== 'object') {
    return { conversationId: null, read: false, lastAdminReadAt: null }
  }
  return {
    conversationId: data.conversationId ? String(data.conversationId) : null,
    read: Boolean(data.read),
    lastAdminReadAt: data.lastAdminReadAt ?? null,
  }
}

/** Header peer helpers when opening from strip vs conversation payload. */
export function conversationPeerFromChat(chat, conversation) {
  const role =
    chat?.role ||
    (chat?.peerRole === 'CHAMP'
      ? 'Champ'
      : chat?.peerRole === 'CUSTOMER'
        ? 'Customer'
        : null) ||
    (conversation?.champ && chat?.contactType === 'Champ' ? 'Champ' : null) ||
    (conversation?.customer ? 'Customer' : conversation?.champ ? 'Champ' : '—')

  const nameFromConversation =
    role === 'Champ'
      ? conversation?.champ?.name || conversation?.customer?.name
      : conversation?.customer?.name || conversation?.champ?.name

  const name = chat?.name || nameFromConversation || '—'

  return {
    name,
    role,
    initials: chat?.initials || initialsFromPeerName(name),
  }
}
