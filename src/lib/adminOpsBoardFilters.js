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

function orderContactTypes(order) {
  if (Array.isArray(order?.contactTypes) && order.contactTypes.length > 0) {
    return order.contactTypes.map(String)
  }
  if (order?.contactType) return [String(order.contactType)]
  return []
}

export function orderMatchesOpsFilter(order, filter) {
  if (!filter || filter === 'All orders') return true
  const types = orderContactTypes(order)
  const hasChat = Boolean(order?.conversationId) || types.length > 0

  if (filter === 'All chats') return hasChat
  if (filter === 'Chat · Champ' || filter === 'Chat - Champ') return types.includes('Champ')
  if (filter === 'Chat · Customer' || filter === 'Chat - Customer') return types.includes('Customer')
  return true
}

export function chatMatchesOpsFilter(chat, filter) {
  if (!filter || filter === 'All orders') return true
  if (filter === 'All chats') return true
  const role = String(chat?.role || '')
  if (filter === 'Chat · Champ' || filter === 'Chat - Champ') return role === 'Champ'
  if (filter === 'Chat · Customer' || filter === 'Chat - Customer') return role === 'Customer'
  return true
}

/**
 * Apply filter to board columns; recount visible orders.
 * @param {Array<{ orders?: unknown[], count?: number, [key: string]: unknown }>} columns
 * @param {string} filter
 */
export function filterOpsBoardColumns(columns, filter) {
  const list = Array.isArray(columns) ? columns : []
  if (!filter || filter === 'All orders') return list

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
