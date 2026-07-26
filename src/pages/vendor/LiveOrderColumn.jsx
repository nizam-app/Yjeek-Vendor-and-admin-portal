import { useCallback, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { OrderCard, DineInCard, getColumns } from '../../components/OrderCards'
import OrderDetailModal from '../../components/OrderDetailModal'
import AcceptOrderModal from '../../components/AcceptOrderModal'
import HandoverChampModal from '../../components/HandoverChampModal'
import RejectOrderModal from '../../components/RejectOrderModal'
import { useApiMutation } from '../../hooks/useApiMutation'
import { useVendorLiveOrders } from '../../hooks/vendor/useVendorLiveOrders'
import { moveAcceptedOrderOnLiveBoard } from '../../mappers/vendor/mapVendorLiveOrders'
import { orderService } from '../../services/vendor/orderService'

export default function LiveOrderColumn() {
  const { key } = useParams()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [acceptedOrder, setAcceptedOrder] = useState(null)
  const [handoverOrder, setHandoverOrder] = useState(null)
  const [rejectOrder, setRejectOrder] = useState(null)
  const [acceptingId, setAcceptingId] = useState(null)
  const [acceptError, setAcceptError] = useState(null)
  const [actioningId, setActioningId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const tab = searchParams.get('tab') === 'dinein' ? 'dinein' : 'delivery'
  const isDineIn = tab === 'dinein'
  const { data: orders, error, isLoading, refetch, setData } = useVendorLiveOrders(tab)
  const { mutate: acceptOrder } = useApiMutation((orderId) => orderService.acceptOrder(orderId))
  const { mutate: performPrimaryAction } = useApiMutation((action) =>
    orderService.performPrimaryAction(action),
  )

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

  const handlePrimaryAction = useCallback(
    async ({ order }) => {
      const action = order?.primaryAction
      const orderId = order?.backendId || order?.id
      if (!action || !orderId) {
        setActionError(new Error('This order action is not available.'))
        return
      }

      setActionError(null)
      setActioningId(String(orderId))
      try {
        await performPrimaryAction(action)
        setHandoverOrder(null)
        await refetch()
      } catch (err) {
        setActionError(err)
      } finally {
        setActioningId(null)
      }
    },
    [performPrimaryAction, refetch],
  )

  const column = getColumns(tab, orders).find((col) => col.key === key)
  const items = column
    ? column.items.filter((order) =>
        [order.id, order.customer, order.items, order.guest]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : []

  if (isLoading) return <div className="p-7 text-[13px] text-ink-muted">Loading orders…</div>
  if (error)
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load orders.{' '}
        <button type="button" onClick={refetch} className="underline">
          Try again
        </button>
      </div>
    )

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <Link
        to={`/live-orders?tab=${tab}`}
        className="inline-flex items-center gap-[6px] text-green-primary text-[13px] font-medium mb-[14px] hover:underline"
      >
        <ArrowLeft size={14} strokeWidth={2.2} />
        Back to live orders
      </Link>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.02em] flex items-center gap-2.5">
            {column ? column.title : 'Not found'}
            <span className="bg-green-active-bg text-green-active-text text-[13px] font-bold rounded-full py-[2px] px-[10px]">
              {items.length}
            </span>
          </h1>
          {column ? <p className="mt-1 text-ink-muted text-[13px]">{column.subtitle}</p> : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <input
          className="border border-border rounded-md py-[10px] px-[14px] text-[13px] bg-white min-w-[220px]"
          style={{ flex: 1 }}
          placeholder="Search orders, customers, items…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {acceptError ? (
        <p className="mb-3 text-[12px] text-danger">
          {acceptError.message || 'Failed to accept order.'}
        </p>
      ) : null}
      {actionError && !handoverOrder ? (
        <p className="mb-3 text-[12px] text-danger">
          {actionError.message || 'Failed to update order.'}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="text-ink-muted text-[13px] p-6 text-center">No orders</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[14px]">
          {items.map((order) =>
            isDineIn ? (
              <DineInCard
                key={order.backendId || order.id}
                order={order}
                mode={key}
                dense
                onSelect={setSelectedOrder}
                onAccept={handleAccept}
                onReject={setRejectOrder}
                accepting={acceptingId === String(order.backendId || order.id)}
              />
            ) : (
              <OrderCard
                key={order.backendId || order.id}
                order={order}
                mode={key}
                dense
                onSelect={setSelectedOrder}
                onAccept={handleAccept}
                onPrimaryAction={handlePrimaryAction}
                onHandoverChamp={setHandoverOrder}
                onReject={setRejectOrder}
                accepting={acceptingId === String(order.backendId || order.id)}
                actioning={actioningId === String(order.backendId || order.id)}
              />
            ),
          )}
        </div>
      )}

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
        onClose={() => setRejectOrder(null)}
        order={rejectOrder?.order}
        tab={tab}
        intent={rejectOrder?.intent}
      />
    </div>
  )
}
