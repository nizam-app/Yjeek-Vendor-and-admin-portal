import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import { OrderCard, DineInCard, getColumns } from '../../components/OrderCards'
import OrderDetailModal from '../../components/OrderDetailModal'
import AcceptOrderModal from '../../components/AcceptOrderModal'
import HandoverChampModal from '../../components/HandoverChampModal'
import RejectOrderModal from '../../components/RejectOrderModal'
import { useAuth } from '../../context/AuthContext'
import { useApiMutation } from '../../hooks/useApiMutation'
import { useNow } from '../../hooks/useNow'
import { useVendorLiveOrders } from '../../hooks/vendor/useVendorLiveOrders'
import { getVendorServiceModes } from '../../mappers/vendor/authMapper'
import {
  moveAcceptedOrderOnLiveBoard,
  moveOrderToPreparingOnLiveBoard,
  moveOrderToReadyOnLiveBoard,
  removeCompletedOrderFromLiveBoard,
  markRejectedOrderOnLiveBoard,
} from '../../mappers/vendor/mapVendorLiveOrders'
import { formatRejectionReasonLabel } from '../../mappers/vendor/mapVendorRejectionReason'
import {
  mergeKeptRejectedIntoNewItems,
  rememberRejectedLiveOrder,
  subscribeKeptRejectedLiveOrders,
} from '../../lib/recentRejectedLiveOrders'
import { syncExpiredAcceptOrders } from '../../lib/handleAcceptSlaExpiry'
import { orderService } from '../../services/vendor/orderService'

const AUTO_REFRESH_MS = 8000
const SEARCH_DEBOUNCE_MS = 300

function matchesLiveOrderSearch(order, query) {
  const q = String(query || '')
    .trim()
    .toLowerCase()
    .replace(/^#/, '')
  if (!q) return true
  const haystack = [
    order.id,
    order.orderNumber,
    order.backendId,
    order.customer,
    order.customerName,
    order.customerPhone,
    order.items,
    order.guest,
    order.table,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/#/g, '')
  return haystack.includes(q)
}

export default function LiveOrders() {
  const { user, refreshVendorSession } = useAuth()
  const canDineIn = getVendorServiceModes(user).dineIn
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(() =>
    canDineIn && searchParams.get('tab') === 'dinein' ? 'dinein' : 'delivery',
  )
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [acceptedOrder, setAcceptedOrder] = useState(null)
  const [handoverOrder, setHandoverOrder] = useState(null)
  const [rejectOrder, setRejectOrder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [acceptingId, setAcceptingId] = useState(null)
  const [acceptError, setAcceptError] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectError, setRejectError] = useState(null)
  const [actioningId, setActioningId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [keptRejectedTick, setKeptRejectedTick] = useState(0)
  const isDineIn = canDineIn && tab === 'dinein'
  const board = isDineIn ? 'dinein' : 'delivery'
  const now = useNow(true)
  const { data: orders, error, isLoading, refetch, setData } = useVendorLiveOrders(board, {
    search: debouncedSearch,
  })
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
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => subscribeKeptRejectedLiveOrders(() => setKeptRejectedTick((n) => n + 1)), [])

  useEffect(() => {
    const newItems =
      board === 'dinein' ? orders?.dineIn?.new || [] : orders?.delivery?.new || []
    void syncExpiredAcceptOrders({
      orders: newItems,
      board,
      now,
      setData,
      rejectOrder: rejectOrderMutation,
    })
  }, [orders, board, now, setData, rejectOrderMutation])

  useEffect(() => {
    const timer = window.setInterval(() => {
      refetch()
    }, AUTO_REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [refetch])

  useEffect(() => {
    const onExternalUpdate = () => {
      refetch()
    }
    window.addEventListener('yjeek:vendor-live-orders-updated', onExternalUpdate)
    return () => window.removeEventListener('yjeek:vendor-live-orders-updated', onExternalUpdate)
  }, [refetch])

  // Refresh serviceModes from /me so Dine-in appears after SLA/supports changes
  // without requiring a full sign-out (and when admin+vendor tokens coexist).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await refreshVendorSession?.()
      } catch {
        // Keep existing session; tab visibility stays based on cached user.
      }
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [refreshVendorSession])

  useEffect(() => {
    if (!canDineIn && tab === 'dinein') {
      setTab('delivery')
    }
  }, [canDineIn, tab])

  useEffect(() => {
    if (!canDineIn && searchParams.get('tab') === 'dinein') {
      const next = new URLSearchParams(searchParams)
      next.delete('tab')
      setSearchParams(next, { replace: true })
    }
  }, [canDineIn, searchParams, setSearchParams])

  const handleRefresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }, [refetch, refreshing])

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
            board: board,
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
    [acceptOrder, board, refetch, setData],
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
        const reasonLabel = formatRejectionReasonLabel(reason) || reason
        rememberRejectedLiveOrder(order, {
          board,
          reason: reasonLabel,
          note,
        })
        setData((current) =>
          markRejectedOrderOnLiveBoard(current, {
            board,
            order,
            reason: reasonLabel,
            note,
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
    [rejectOrder, rejectOrderMutation, board, refetch, setData],
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
        const actionKey = String(action?.key || '').toUpperCase()
        const actionPath = String(action?.path || '')
        const isCompleteAction =
          canComplete &&
          (board === 'dinein' ||
            actionKey === 'HANDOVER_TO_CUSTOMER' ||
            (!action && board === 'dinein') ||
            actionPath.includes('/complete'))
        const isHandoverAction = actionKey === 'HANDOVER_TO_CHAMP' || actionPath.includes('/handover')

        if (isCompleteAction) {
          await completeOrder(orderId)
          setData((current) =>
            removeCompletedOrderFromLiveBoard(current, {
              board: board,
              order,
            }),
          )
        } else if (action) {
          await performPrimaryAction(action)
          if (isHandoverAction) {
            setData((current) =>
              removeCompletedOrderFromLiveBoard(current, {
                board: board,
                order,
              }),
            )
          }
        } else if (canMarkReady) {
          const result = await markReady(orderId)
          setData((current) =>
            moveOrderToReadyOnLiveBoard(current, {
              board: board,
              previousOrder: order,
              readyOrder: result?.data || order,
            }),
          )
        } else {
          const result = await startPreparing(orderId)
          setData((current) =>
            moveOrderToPreparingOnLiveBoard(current, {
              board: board,
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
    [completeOrder, markReady, performPrimaryAction, board, refetch, setData, startPreparing],
  )

  const columns = useMemo(() => {
    void keptRejectedTick
    return getColumns(board, orders, { now }).map((col) => {
      const items =
        col.key === 'new'
          ? mergeKeptRejectedIntoNewItems(col.items, { board, now })
          : col.items
      return {
        ...col,
        items: items.filter((order) => matchesLiveOrderSearch(order, searchQuery)),
      }
    })
  }, [board, orders, now, searchQuery, keptRejectedTick])

  // Keep the server's count stable while the user filters cards locally.
  const totalActive =
    typeof orders?.activeCount === 'number'
      ? orders.activeCount
      : getColumns(board, orders, { now }).reduce((sum, col) => sum + col.items.length, 0)

  if (isLoading && !orders) {
    return <div className="p-7 text-[13px] text-ink-muted">Loading live orders…</div>
  }
  if (error && !orders) {
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load live orders.{' '}
        <button type="button" onClick={handleRefresh} className="underline">
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
          {canDineIn ? (
            <button
              type="button"
              className={`py-2 px-4 rounded-[10px] text-[13px] font-medium ${
                isDineIn ? 'bg-white text-ink shadow-card' : 'text-ink-muted'
              }`}
              onClick={() => setTab('dinein')}
            >
              Dine-in
            </button>
          ) : null}
        </div>
        <input
          className="border border-border rounded-md py-[10px] px-[14px] text-[13px] bg-white min-w-[220px]"
          placeholder="Search by order #…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search live orders by order number"
        />
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || (isLoading && !orders)}
          className="border border-border rounded-[8px] py-2 px-[14px] text-[13px] bg-white font-medium hover:bg-[#f7f9f7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? 'Refreshing…' : '↻ Refresh'}
        </button>
        {error ? (
          <p className="text-[12px] text-danger">
            Refresh failed.{' '}
            <button type="button" onClick={handleRefresh} className="underline">
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
                  to={`/live-orders/${col.key}?tab=${board}`}
                  className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-[6px] text-ink-muted bg-white hover:text-green-primary hover:bg-green-active-bg"
                  aria-label={`Open ${col.title} in full page`}
                  title={`Open ${col.title} in full page`}
                >
                  <ArrowUpRight size={14} strokeWidth={2} />
                </Link>
              </div>
            </div>
            {col.items.length === 0 ? (
              <div className="text-ink-muted text-[13px] p-6 text-center">
                {searchQuery.trim() ? 'No matching orders' : 'No orders'}
              </div>
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
