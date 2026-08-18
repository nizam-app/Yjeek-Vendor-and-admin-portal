/** Shared Live / Pickup / Dine-in / Services board filter + refresh helpers. */

export const ADMIN_OPS_BOARD_FILTERS = [
  'All orders',
  'All chats',
  'Chat · Champ',
  'Chat · Customer',
]

export const ADMIN_OPS_DEFAULT_REFRESH_SECONDS = 3

export function resolveAdminBoardFilters(filters) {
  if (Array.isArray(filters) && filters.length > 0) {
    return filters.map((item) => String(item))
  }
  return [...ADMIN_OPS_BOARD_FILTERS]
}

/**
 * Prefer API autoRefreshSeconds / refreshIntervalSeconds; fall back to design default.
 * @param {Record<string, unknown>|null|undefined} data
 */
export function resolveAdminBoardRefreshSeconds(data) {
  if (!data || typeof data !== 'object') return ADMIN_OPS_DEFAULT_REFRESH_SECONDS
  const raw = data.autoRefreshSeconds ?? data.refreshIntervalSeconds
  if (raw === null || raw === undefined || raw === '') return ADMIN_OPS_DEFAULT_REFRESH_SECONDS
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return ADMIN_OPS_DEFAULT_REFRESH_SECONDS
  return Math.floor(n)
}

/** @param {string} [filter] */
export function normalizeOpsChatFilter(filter) {
  const value = String(filter || '').trim()
  if (!value || value === 'All orders') return 'all_orders'
  if (value === 'All chats') return 'all_chats'
  if (value === 'Chat · Champ' || value === 'Chat - Champ') return 'champ'
  if (value === 'Chat · Customer' || value === 'Chat - Customer') return 'customer'
  return 'all_orders'
}

export function isOpsChatFilter(filter) {
  const key = normalizeOpsChatFilter(filter)
  return key === 'all_chats' || key === 'champ' || key === 'customer'
}

function orderContactTypes(order) {
  if (Array.isArray(order?.contactTypes) && order.contactTypes.length > 0) {
    return order.contactTypes.map(String)
  }
  if (order?.contactType) return [String(order.contactType)]
  return []
}

export function orderMatchesOpsFilter(order, filter) {
  const key = normalizeOpsChatFilter(filter)
  if (key === 'all_orders') return true
  const types = orderContactTypes(order)
  const hasChat = Boolean(order?.conversationId) || types.length > 0

  if (key === 'all_chats') return hasChat
  if (key === 'champ') return types.includes('Champ')
  if (key === 'customer') return types.includes('Customer')
  return true
}

export function chatMatchesOpsFilter(chat, filter) {
  const key = normalizeOpsChatFilter(filter)
  if (key === 'all_orders' || key === 'all_chats') return true
  const role = String(chat?.role || '')
  if (key === 'champ') return role === 'Champ'
  if (key === 'customer') return role === 'Customer'
  return true
}

/**
 * Apply filter to board columns; recount visible orders.
 * @param {Array<{ orders?: unknown[], count?: number, [key: string]: unknown }>} columns
 * @param {string} filter
 */
export function filterOpsBoardColumns(columns, filter) {
  const list = Array.isArray(columns) ? columns : []
  if (!isOpsChatFilter(filter)) return list

  return list.map((column) => {
    const orders = (Array.isArray(column.orders) ? column.orders : [])
      .filter((order) => orderMatchesOpsFilter(order, filter))
    return {
      ...column,
      orders,
      count: orders.length,
    }
  })
}

export function flattenOpsBoardOrders(columns) {
  return (Array.isArray(columns) ? columns : []).flatMap((column) => (
    Array.isArray(column?.orders) ? column.orders : []
  ))
}

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function conversationCategories(order, chat) {
  const types = orderContactTypes(order)
  const categories = []
  if (types.includes('Champ')) categories.push('Champ')
  if (types.includes('Customer')) categories.push('Customer')
  if (categories.length > 0) return categories

  const role = String(chat?.role || '')
  if (role === 'Champ' || role === 'Customer') return [role]
  return chat ? ['Customer'] : []
}

/**
 * Category-wise chat cards for All chats / Champ / Customer filters.
 * One conversation can produce both Champ and Customer cards when both peers messaged.
 *
 * @param {unknown[]} chats
 * @param {unknown[]} orders
 * @param {string} filter
 */
export function buildOpsBoardChats(chats, orders, filter) {
  const key = normalizeOpsChatFilter(filter)
  const chatList = Array.isArray(chats) ? chats : []
  const orderList = Array.isArray(orders) ? orders : []

  if (key === 'all_orders') return chatList

  const orderByConversation = new Map()
  for (const order of orderList) {
    const id = order?.conversationId ? String(order.conversationId) : ''
    if (id) orderByConversation.set(id, order)
  }

  const chatByConversation = new Map()
  for (const chat of chatList) {
    const id = String(chat?.conversationId || chat?.id || '')
    if (id) chatByConversation.set(id, chat)
  }

  const conversationIds = new Set([
    ...chatByConversation.keys(),
    ...orderByConversation.keys(),
  ])

  const items = []

  for (const conversationId of conversationIds) {
    const chat = chatByConversation.get(conversationId) || null
    const order = orderByConversation.get(conversationId) || null
    const categories = conversationCategories(order, chat)
    const wantedRoles = key === 'champ'
      ? ['Champ']
      : key === 'customer'
        ? ['Customer']
        : categories

    for (const role of wantedRoles) {
      if (!categories.includes(role)) continue

      const champName = order?.rider?.name || order?.champ?.name || 'Champ'
      const customerName = chat?.role === 'Customer' && chat?.name ? chat.name : 'Customer'
      const name = role === 'Champ' ? champName : customerName
      const fromFeed = Boolean(chat && chat.role === role)

      items.push({
        ...(chat || {}),
        id: `${conversationId}:${role}`,
        conversationId,
        orderId: order?.orderId || chat?.orderId || null,
        orderNumber: order?.id || chat?.orderNumber || null,
        name,
        role,
        peerRole: role === 'Champ' ? 'CHAMP' : 'CUSTOMER',
        message: fromFeed ? (chat.message || '') : (chat?.message || ''),
        unreadCount: fromFeed ? (Number(chat.unreadCount) || 0) : 0,
        initials: initialsFromName(name),
      })
    }
  }

  return items
}
