/**
 * When accept SLA hits 0: keep REJECTED card on New column + sync backend reject.
 */

import { ACCEPT_SLA_EXPIRED_REASON, isAcceptSlaExpired } from './orderTimers'
import { rememberRejectedLiveOrder } from './recentRejectedLiveOrders'
import { markRejectedOrderOnLiveBoard } from '../mappers/vendor/mapVendorLiveOrders'
import { VENDOR_REJECTION_REASONS } from '../mappers/vendor/mapVendorRejectionReason'

const handledKeys = new Set()
const inFlight = new Set()

function orderKey(order) {
  return String(order?.backendId || order?.id || order?.orderNumber || '').trim()
}

/**
 * Scan New-column orders; materialize expired ones as rejected and reject on API once.
 */
export async function syncExpiredAcceptOrders({
  orders,
  board = 'delivery',
  now = Date.now(),
  setData,
  rejectOrder,
}) {
  const list = Array.isArray(orders) ? orders : []
  const expired = list.filter(
    (order) =>
      order &&
      String(order.status || '').toLowerCase() !== 'rejected' &&
      String(order.status || '').toLowerCase() !== 'no-show-cancelled' &&
      isAcceptSlaExpired(order, now),
  )
  if (!expired.length) return

  for (const order of expired) {
    const key = orderKey(order)
    if (!key || handledKeys.has(key) || inFlight.has(key)) continue

    inFlight.add(key)

    rememberRejectedLiveOrder(order, {
      board,
      reason: ACCEPT_SLA_EXPIRED_REASON,
      note: ACCEPT_SLA_EXPIRED_REASON,
    })

    if (typeof setData === 'function') {
      setData((current) =>
        markRejectedOrderOnLiveBoard(current, {
          board,
          order,
          reason: ACCEPT_SLA_EXPIRED_REASON,
          note: ACCEPT_SLA_EXPIRED_REASON,
        }),
      )
    }

    try {
      if (typeof rejectOrder === 'function') {
        const orderId = order.backendId || order.id
        if (orderId) {
          await rejectOrder({
            orderId,
            reason: VENDOR_REJECTION_REASONS.OTHER,
            note: ACCEPT_SLA_EXPIRED_REASON,
          })
        }
      }
    } catch {
      // Job / another tab may already have closed the order — card stays via rememberRejected.
    } finally {
      handledKeys.add(key)
      inFlight.delete(key)
    }
  }
}
