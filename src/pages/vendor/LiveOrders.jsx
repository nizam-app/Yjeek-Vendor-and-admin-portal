import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import { OrderCard, DineInCard, getColumns } from '../../components/OrderCards'
import OrderDetailModal from '../../components/OrderDetailModal'
import AcceptOrderModal from '../../components/AcceptOrderModal'
import HandoverChampModal from '../../components/HandoverChampModal'
import RejectOrderModal from '../../components/RejectOrderModal'
import { useApiMutation } from '../../hooks/useApiMutation'
import { useVendorLiveOrders } from '../../hooks/vendor/useVendorLiveOrders'
import {
  moveAcceptedOrderOnLiveBoard,
  moveOrderToPreparingOnLiveBoard,
  moveOrderToReadyOnLiveBoard,
  removeCompletedOrderFromLiveBoard,
  removeRejectedOrderFromLiveBoard,
} from '../../mappers/vendor/mapVendorLiveOrders'
import { orderService } from '../../services/vendor/orderService'

const AUTO_REFRESH_MS = 8000

export default function LiveOrders() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') === 'dinein' ? 'dinein' : 'delivery')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [acceptedOrder, setAcceptedOrder] = useState(null)
  const [handoverOrder, setHandoverOrder] = useState(null)
  const [rejectOrder, setRejectOrder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [acceptingId, setAcceptingId] = useState(null)
  const [acceptError, setAcceptError] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectError, setRejectError] = useState(null)
  const [actioningId, setActioningId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const isDineIn = tab === 'dinein'
  const { data: orders, error, isLoading, refetch, setData } = useVendorLiveOrders(tab)
  const { mutate: acceptOrder } = useApiMutation((orderId) => orderService.acceptOrder(orderId))
  const { mutate: rejectOrderMutation } = useApiMutation(({ orderId, reason, note }) =>
    orderService.rejectOrder(orderId, { reason, note }),
  )
  const { mutate: startPreparing } = useApiMutation((orderId) => orderService.startPreparing(orderId))
  const { mutate: markReady } = useApiMutation((orderId) => orderService.markReady(orderId))
  const { mutate: completeOrder } = useApiMutation((orderId) => orderService.completeOrder(orderId))
  const { mutate: performPrimaryAction } = useApiMutation((action) =>
    orderService.performPrimaryAction(action),
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      refetch()
    }, AUTO_REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [refetch])

  const handleAccept = useCallback(
    async ({ order, mode }) => {
      const orderId = order?.backendId || order?.id
      if (!orderId) {
        setAcceptError(new Error('Order id is missing.'))
        return
      }

      setAcceptError(null)
      setAcceptingId(String(orderId))
      try {
        const result = await acceptOrder(orderId)
        const mapped = result?.data || order
        setAcceptedOrder({ order: mapped, mode })
        setData((current) =>
          moveAcceptedOrderOnLiveBoard(current, {
            board: tab,
            previousOrder: order,
            acceptedOrder: mapped,
          }),
        )
        refetch()
      } catch (err) {
        setAcceptError(err)
      } finally {
        setAcceptingId(null)
      }
    },
    [acceptOrder, refetch, setData, tab],
  )

  const handleReject = useCallback(
    async ({ reason, note }) => {
      if (rejectOrder?.intent === 'no-show') {
        setRejectError(new Error('No-show is not available yet.'))
        return
      }

      const order = rejectOrder?.order
      const orderId = order?.backendId || order?.id
      if (!orderId) {
        setRejectError(new Error('Order id is missing.'))
        return
      }

      setRejectError(null)
      setRejectingId(String(orderId))
      try {
        await rejectOrderMutation({ orderId, reason, note })
        setData((current) =>
          removeRejectedOrderFromLiveBoard(current, {
            board: tab,
            order,
          }),
        )
        setRejectOrder(null)
        refetch()
      } catch (err) {
        setRejectError(err)
      } finally {
        setRejectingId(null)
      }
    },
    [rejectOrder, rejectOrderMutation, refetch, setData, tab],
  )

  const handlePrimaryAction = useCallback(
    async ({ order, mode }) => {
      const action = order?.primaryAction
      const orderId = order?.backendId || order?.id
      if (!orderId) {
        setActionError(new Error('Order id is missing.'))
        return
      }

      const canStartPreparing = mode === 'accepted' || mode === 'confirmed'
      const canMarkReady = mode === 'preparing'
      const canComplete = mode === 'ready'
      if (!action && !canStartPreparing && !canMarkReady && !canComplete) {
        setActionError(new Error('This order action is not available.'))
        return
      }

      setActionError(null)
      setActioningId(String(orderId))
      try {
        if (
          canComplete &&
          (tab === 'dinein' || !action || String(action.path || '').includes('/complete'))
        ) {
          await completeOrder(orderId)
          setData((current) =>
            removeCompletedOrderFromLiveBoard(current, {
              board: tab,
              order,
            }),
          )
        } else if (action) {
          await performPrimaryAction(action)
          if (canComplete) {
            setData((current) =>
              removeCompletedOrderFromLiveBoard(current, {
                board: tab,
                order,
              }),
            )
          }
        } else if (canMarkReady) {
          const result = await markReady(orderId)
          setData((current) =>
            moveOrderToReadyOnLiveBoard(current, {
              board: tab,
              previousOrder: order,
              readyOrder: result?.data || order,
            }),
          )
        } else {
          const result = await startPreparing(orderId)
          setData((current) =>
            moveOrderToPreparingOnLiveBoard(current, {
              board: tab,
              previousOrder: order,
              preparingOrder: result?.data || order,
            }),
          )
        }
        setHandoverOrder(null)
        await refetch()
      } catch (err) {
        setActionError(err)
      } finally {
        setActioningId(null)
      }
    },
    [completeOrder, markReady, performPrimaryAction, refetch, setData, startPreparing, tab],
  )

  const columns = getColumns(tab, orders).map((col) => ({
    ...col,
    items: col.items.filter((order) => {
      if (!searchQuery.trim()) return true
      const haystack = [order.id, order.customer, order.items, order.guest]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(searchQuery.trim().toLowerCase())
    }),
  }))
  // Keep the server's count stable while the user filters cards locally.
  const totalActive =
    typeof orders?.activeCount === 'number'
      ? orders.activeCount
      : getColumns(tab, orders).reduce((sum, col) => sum + col.items.length, 0)

  if (isLoading && !orders) {
    return <div className="p-7 text-[13px] text-ink-muted">Loading live orders…</div>
  }
  if (error && !orders) {
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load live orders.{' '}
        <button type="button" onClick={refetch} className="underline">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <PageHeader
        title={isDineIn ? 'Dine-in queue' : 'Live orders'}
        subtitle={`${totalActive} active · auto-refresh ${AUTO_REFRESH_MS / 1000}s`}
      />

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="inline-flex bg-[#eef1ee] rounded-[9px] p-[4px]">
          <button
            type="button"
            className={`py-2 px-4 rounded-[7px] text-[13px] font-medium ${
              !isDineIn ? 'bg-white text-ink shadow-card' : 'text-ink-muted'
            }`}
            onClick={() => setTab('delivery')}
          >
            Delivery & Pickup
          </button>
          <button
            type="button"
            className={`py-2 px-4 rounded-[10px] text-[13px] font-medium ${
              isDineIn ? 'bg-white text-ink shadow-card' : 'text-ink-muted'
            }`}
            onClick={() => setTab('dinein')}
          >
            Dine-in
          </button>
        </div>
        <input
          className="border border-border rounded-md py-[10px] px-[14px] text-[13px] bg-white min-w-[220px]"
          placeholder="Search by order #…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <button
          type="button"
          onClick={() => refetch()}
          className="border border-border rounded-[8px] py-2 px-[14px] text-[13px] bg-white font-medium hover:bg-[#f7f9f7]"
        >
          ↻ Refresh
        </button>
        {error ? (
          <p className="text-[12px] text-danger">
            Refresh failed.{' '}
            <button type="button" onClick={refetch} className="underline">
              Retry
            </button>
          </p>
        ) : null}
        {acceptError ? (
          <p className="text-[12px] text-danger">
            {acceptError.message || 'Failed to accept order.'}
          </p>
        ) : null}
        {rejectError && !rejectOrder ? (
          <p className="text-[12px] text-danger">
            {rejectError.message || 'Failed to reject order.'}
          </p>
        ) : null}
        {actionError && !handoverOrder ? (
          <p className="text-[12px] text-danger">
            {actionError.message || 'Failed to update order.'}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-4 gap-[14px] max-[1200px]:grid-cols-2">
        {columns.map((col) => (
          <div key={col.key} className="bg-[#eef2ee] rounded-lg py-[14px] px-3 min-h-[520px]">
            <div className="flex items-center justify-between mb-3 font-bold text-sm">
              <span>{col.title}</span>
              <div className="flex items-center gap-2">
                <span className="bg-white rounded-full py-[2px] px-2 text-xs text-ink-muted">
                  {col.items.length}
                </span>
                <Link
                  to={`/live-orders/${col.key}?tab=${tab}`}
                  className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-[6px] text-ink-muted bg-white hover:text-green-primary hover:bg-green-active-bg"
                  aria-label={`Open ${col.title} in full page`}
                  title={`Open ${col.title} in full page`}
                >
                  <ArrowUpRight size={14} strokeWidth={2} />
                </Link>
              </div>
            </div>
            {col.items.length === 0 ? (
              <div className="text-ink-muted text-[13px] p-6 text-center">No orders</div>
            ) : (
              col.items.map((order) =>
                isDineIn ? (
                  <DineInCard
                    key={order.backendId || order.id}
                    order={order}
                    mode={col.key}
                    onSelect={setSelectedOrder}
                    onAccept={handleAccept}
                    onPrimaryAction={handlePrimaryAction}
                    onReject={(payload) => {
                      setRejectError(null)
                      setRejectOrder(payload)
                    }}
                    accepting={acceptingId === String(order.backendId || order.id)}
                    rejecting={rejectingId === String(order.backendId || order.id)}
                    actioning={actioningId === String(order.backendId || order.id)}
                  />
                ) : (
                  <OrderCard
                    key={order.backendId || order.id}
                    order={order}
                    mode={col.key}
                    onSelect={setSelectedOrder}
                    onAccept={handleAccept}
                    onPrimaryAction={handlePrimaryAction}
                    onHandoverChamp={setHandoverOrder}
                    onReject={(payload) => {
                      setRejectError(null)
                      setRejectOrder(payload)
                    }}
                    accepting={acceptingId === String(order.backendId || order.id)}
                    rejecting={rejectingId === String(order.backendId || order.id)}
                    actioning={actioningId === String(order.backendId || order.id)}
                  />
                ),
              )
            )}
          </div>
        ))}
      </div>

      <OrderDetailModal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder?.order}
        mode={selectedOrder?.mode}
        tab={tab}
      />

      <AcceptOrderModal
        open={Boolean(acceptedOrder)}
        onClose={() => setAcceptedOrder(null)}
        order={acceptedOrder?.order}
        tab={tab}
      />

      <HandoverChampModal
        open={Boolean(handoverOrder)}
        onClose={() => {
          setHandoverOrder(null)
          setActionError(null)
        }}
        onConfirm={() => handlePrimaryAction(handoverOrder)}
        order={handoverOrder?.order}
        isSubmitting={
          actioningId ===
          String(handoverOrder?.order?.backendId || handoverOrder?.order?.id || '')
        }
        error={actionError}
      />

      <RejectOrderModal
        open={Boolean(rejectOrder?.order)}
        onClose={() => {
          if (rejectingId) return
          setRejectOrder(null)
          setRejectError(null)
        }}
        onConfirm={handleReject}
        order={rejectOrder?.order}
        tab={tab}
        intent={rejectOrder?.intent}
        isSubmitting={
          rejectingId ===
          String(rejectOrder?.order?.backendId || rejectOrder?.order?.id || '')
        }
        error={rejectError}
      />
    </div>
  )
}
