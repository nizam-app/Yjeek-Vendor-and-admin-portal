/**
 * Session keep-alive for vendor-rejected live orders.
 * Backend live board drops REJECTED immediately; we keep the card visible briefly.
 */

const DEFAULT_TTL_MS = 10 * 60 * 1000
const listeners = new Set()
let rows = []

function orderKey(order) {
  return String(order?.backendId || order?.id || order?.orderNumber || '').trim()
}

function emit() {
  for (const listener of listeners) listener(rows)
}

export function rememberRejectedLiveOrder(order, { board = 'delivery', reason, note, ttlMs = DEFAULT_TTL_MS } = {}) {
  if (!order) return null
  const key = orderKey(order)
  if (!key) return null

  const card = {
    ...order,
    status: 'rejected',
    reason: reason || order.reason || undefined,
    note: note || order.note || undefined,
    sla: undefined,
    vendorAcceptDeadline: null,
    primaryAction: null,
    _board: board,
    _keptUntil: Date.now() + ttlMs,
  }

  rows = [...rows.filter((row) => orderKey(row) !== key), card]
  emit()
  return card
}

export function forgetRejectedLiveOrder(orderOrId) {
  const key =
    typeof orderOrId === 'string' || typeof orderOrId === 'number'
      ? String(orderOrId).trim()
      : orderKey(orderOrId)
  if (!key) return
  const next = rows.filter((row) => orderKey(row) !== key)
  if (next.length === rows.length) return
  rows = next
  emit()
}

export function listKeptRejectedLiveOrders({ board, now = Date.now() } = {}) {
  return rows
    .filter((row) => Number(row._keptUntil) > now)
    .filter((row) => !board || row._board === board)
    .map(({ _board, _keptUntil, ...order }) => order)
}

export function subscribeKeptRejectedLiveOrders(listener) {
  listeners.add(listener)
  listener(rows)
  return () => listeners.delete(listener)
}

export function mergeKeptRejectedIntoNewItems(items, { board, now = Date.now() } = {}) {
  const live = Array.isArray(items) ? items : []
  const liveKeys = new Set(live.map(orderKey).filter(Boolean))
  const extras = listKeptRejectedLiveOrders({ board, now }).filter((row) => {
    const key = orderKey(row)
    return key && !liveKeys.has(key)
  })
  return extras.length ? [...live, ...extras] : live
}
