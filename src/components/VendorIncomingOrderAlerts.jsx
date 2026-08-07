import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApiMutation } from '../hooks/useApiMutation'
import { useNow } from '../hooks/useNow'
import { isAcceptSlaExpired } from '../lib/orderTimers'
import { syncExpiredAcceptOrders } from '../lib/handleAcceptSlaExpiry'
import { rememberRejectedLiveOrder } from '../lib/recentRejectedLiveOrders'
import { formatRejectionReasonLabel } from '../mappers/vendor/mapVendorRejectionReason'
import { orderService } from '../services/vendor/orderService'
import AcceptOrderModal from './AcceptOrderModal'
import NewOrderAlertModal from './NewOrderAlertModal'
import NewOrderToastStack from './NewOrderToastStack'
import RejectOrderModal from './RejectOrderModal'

export const VENDOR_LIVE_ORDERS_UPDATED_EVENT = 'yjeek:vendor-live-orders-updated'

const POLL_MS = 4000

function orderKey(order) {
  return String(order?.backendId || order?.id || '').trim()
}

function canAcceptIncoming(order, board) {
  if (!order) return false
  if (order.status === 'rejected' || order.status === 'no-show-cancelled') return false

  // Dine-in unpaid — Live Orders shows "Awaiting customer payment" (no Accept yet).
  if (board === 'dinein') {
    if (order.note === 'Awaiting customer payment') return false
    const payment = String(order.paymentStatus || '').toUpperCase()
    const hasSla = Boolean(order.vendorAcceptDeadline || order.sla)
    if (!hasSla && payment && payment !== 'PAID') return false
  }

  return true
}

function collectNewColumn(data, board) {
  if (!data || typeof data !== 'object') return []
  if (board === 'dinein') return Array.isArray(data.dineIn?.new) ? data.dineIn.new : []
  return Array.isArray(data.delivery?.new) ? data.delivery.new : []
}

function notifyLiveOrdersUpdated() {
  window.dispatchEvent(new CustomEvent(VENDOR_LIVE_ORDERS_UPDATED_EVENT))
}

/**
 * Global incoming-order watcher for VendorLayout.
 * Primary alert (top-center) + stacked right toasts for extra NEW orders.
 * Non-blocking so the vendor can keep working.
 */
export default function VendorIncomingOrderAlerts() {
  const { user } = useAuth()
  const branchId = user?.vendorLocationId || null

  const seenRef = useRef(new Set())
  const pollInFlight = useRef(false)

  const [queue, setQueue] = useState([])
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectError, setRejectError] = useState(null)
  const [acceptError, setAcceptError] = useState(null)
  const [acceptedOrder, setAcceptedOrder] = useState(null)

  const { mutate: acceptOrder } = useApiMutation((orderId) => orderService.acceptOrder(orderId))
  const { mutate: rejectOrderMutation } = useApiMutation(({ orderId, reason, note }) =>
    orderService.rejectOrder(orderId, { reason, note }),
  )

  const current = queue[0] || null
  const toastItems = queue.slice(1)
  const now = useNow(queue.length > 0)

  useEffect(() => {
    if (!queue.length) return
    const expired = queue.filter((item) => isAcceptSlaExpired(item.order, now))
    if (!expired.length) return

    void syncExpiredAcceptOrders({
      orders: expired.map((item) => item.order),
      board: expired[0]?.board === 'dinein' ? 'dinein' : 'delivery',
      now,
      rejectOrder: rejectOrderMutation,
    })

    setQueue((prev) => {
      const next = prev.filter((item) => !isAcceptSlaExpired(item.order, now))
      return next.length === prev.length ? prev : next
    })
    notifyLiveOrdersUpdated()
  }, [now, queue.length, rejectOrderMutation])

  const dismissCurrent = useCallback(() => {
    setQueue((prev) => prev.slice(1))
    setRejectOpen(false)
    setRejectError(null)
    setAcceptError(null)
  }, [])

  const promoteToast = useCallback((key) => {
    setRejectOpen(false)
    setRejectError(null)
    setAcceptError(null)
    setQueue((prev) => {
      const index = prev.findIndex((item) => item.key === key)
      if (index <= 0) return prev
      const next = [...prev]
      const [picked] = next.splice(index, 1)
      return [picked, ...next]
    })
  }, [])

  const poll = useCallback(async () => {
    if (!user || user.role !== 'vendor' || pollInFlight.current) return
    pollInFlight.current = true
    try {
      const boards = ['delivery', 'dinein']
      const responses = await Promise.all(
        boards.map((board) =>
          orderService.getLiveOrders({ board, branchId }).catch(() => null),
        ),
      )

      const found = []
      let anySuccess = false
      for (let i = 0; i < boards.length; i += 1) {
        const board = boards[i]
        const payload = responses[i]
        if (!payload?.data) continue
        anySuccess = true
        const rows = collectNewColumn(payload.data, board)
        for (const order of rows) {
          if (!canAcceptIncoming(order, board)) continue
          const key = orderKey(order)
          if (!key) continue
          found.push({ key, order, board })
        }
      }

      if (!anySuccess) return

      const liveKeys = new Set(found.map((item) => item.key))
      setQueue((prev) => prev.filter((item) => liveKeys.has(item.key)))

      // Refresh order payloads already in queue (keeps SLA timers accurate).
      setQueue((prev) =>
        prev.map((item) => {
          const live = found.find((row) => row.key === item.key)
          return live ? { ...item, order: live.order, board: live.board } : item
        }),
      )

      const fresh = found.filter((item) => !seenRef.current.has(item.key))
      if (!fresh.length) return

      for (const item of fresh) seenRef.current.add(item.key)

      setQueue((prev) => {
        const existing = new Set(prev.map((item) => item.key))
        const next = [...prev]
        for (const item of fresh) {
          if (!existing.has(item.key)) next.push(item)
        }
        return next
      })
    } finally {
      pollInFlight.current = false
    }
  }, [user, branchId])

  useEffect(() => {
    seenRef.current = new Set()
    setQueue([])
    setRejectOpen(false)
    setAcceptError(null)
  }, [user?.id, branchId])

  useEffect(() => {
    if (!user || user.role !== 'vendor') return undefined
    poll()
    const timer = window.setInterval(poll, POLL_MS)
    return () => window.clearInterval(timer)
  }, [user, poll])

  const handleAccept = useCallback(async () => {
    if (!current || accepting) return
    const orderId = orderKey(current.order)
    if (!orderId) return

    setAcceptError(null)
    setAccepting(true)
    try {
      const result = await acceptOrder(orderId)
      const mapped = result?.data || current.order
      setAcceptedOrder({ order: mapped, board: current.board })
      dismissCurrent()
      notifyLiveOrdersUpdated()
    } catch (err) {
      setAcceptError(err)
    } finally {
      setAccepting(false)
    }
  }, [current, accepting, acceptOrder, dismissCurrent])

  const handleRejectConfirm = useCallback(
    async ({ reason, note }) => {
      if (!current) return
      const orderId = orderKey(current.order)
      if (!orderId) return

      setRejectError(null)
      setRejecting(true)
      try {
        await rejectOrderMutation({ orderId, reason, note })
        const reasonLabel = formatRejectionReasonLabel(reason) || reason
        rememberRejectedLiveOrder(current.order, {
          board: current.board === 'dinein' ? 'dinein' : 'delivery',
          reason: reasonLabel,
          note,
        })
        setRejectOpen(false)
        dismissCurrent()
        notifyLiveOrdersUpdated()
      } catch (err) {
        setRejectError(err)
      } finally {
        setRejecting(false)
      }
    },
    [current, rejectOrderMutation, dismissCurrent],
  )

  if (!user || user.role !== 'vendor') return null

  return (
    <>
      <NewOrderAlertModal
        open={Boolean(current) && !rejectOpen}
        order={current?.order}
        board={current?.board || 'delivery'}
        onAccept={handleAccept}
        onReject={() => {
          setRejectError(null)
          setRejectOpen(true)
        }}
        accepting={accepting}
        rejecting={rejecting}
      />

      <NewOrderToastStack items={toastItems} onSelect={promoteToast} />

      {acceptError && current && !rejectOpen ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[82] flex justify-center px-4">
          <p className="pointer-events-auto rounded-[10px] border border-[#f2cccc] bg-[#fff5f5] px-4 py-2 text-[12px] text-[#a93e42] shadow-lg">
            {acceptError?.message || 'Failed to accept order.'}
          </p>
        </div>
      ) : null}

      <RejectOrderModal
        open={Boolean(current) && rejectOpen}
        order={current?.order}
        tab={current?.board === 'dinein' ? 'dinein' : 'delivery'}
        intent="reject"
        isSubmitting={rejecting}
        error={rejectError}
        onClose={() => {
          if (rejecting) return
          setRejectOpen(false)
          setRejectError(null)
        }}
        onConfirm={handleRejectConfirm}
      />

      <AcceptOrderModal
        open={Boolean(acceptedOrder)}
        order={acceptedOrder?.order}
        tab={acceptedOrder?.board === 'dinein' ? 'dinein' : 'delivery'}
        onClose={() => setAcceptedOrder(null)}
      />
    </>
  )
}
