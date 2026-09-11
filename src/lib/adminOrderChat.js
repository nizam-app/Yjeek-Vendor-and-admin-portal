/**
 * Resolve the operational conversation id for an order card contact badge.
 * @param {Record<string, unknown>} order
 * @param {'Customer'|'Champ'|string} contactType
 */
export function resolveOrderConversationId(order, contactType) {
  if (!order || typeof order !== 'object') return null
  const role = String(contactType || '')
  if (role === 'Customer') {
    return order.customerConversationId ? String(order.customerConversationId) : null
  }
  if (role === 'Champ') {
    return order.driverConversationId ? String(order.driverConversationId) : null
  }
  return order.conversationId ? String(order.conversationId) : null
}

/**
 * Whether an order has an active ops chat for the given contact type.
 */
export function orderHasOpsChat(order, contactType) {
  return Boolean(resolveOrderConversationId(order, contactType))
}
