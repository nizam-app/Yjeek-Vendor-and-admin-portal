import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { OrderCard, DineInCard, getColumns } from '../components/OrderCards'
import OrderDetailModal from '../components/OrderDetailModal'
import AcceptOrderModal from '../components/AcceptOrderModal'
import HandoverChampModal from '../components/HandoverChampModal'
import RejectOrderModal from '../components/RejectOrderModal'

export default function LiveOrderColumn() {
  const { key } = useParams()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [acceptedOrder, setAcceptedOrder] = useState(null)
  const [handoverOrder, setHandoverOrder] = useState(null)
  const [rejectOrder, setRejectOrder] = useState(null)
  const tab = searchParams.get('tab') === 'dinein' ? 'dinein' : 'delivery'
  const isDineIn = tab === 'dinein'

  const column = getColumns(tab).find((col) => col.key === key)
  const items = column
    ? column.items.filter((order) =>
        [order.id, order.customer, order.items, order.guest]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : []

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <Link
        to={`/live-orders?tab=${tab}`}
        className="inline-flex items-center gap-[6px] text-green-primary text-[13px] font-semibold mb-[14px] hover:underline"
      >
        <ArrowLeft size={14} strokeWidth={2.2} />
        Back to live orders
      </Link>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.02em] flex items-center gap-2.5">
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

      {items.length === 0 ? (
        <div className="text-ink-muted text-[13px] p-6 text-center">No orders</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[14px]">
          {items.map((order) =>
            isDineIn ? (
              <DineInCard key={order.id} order={order} mode={key} dense onSelect={setSelectedOrder} onAccept={setAcceptedOrder} onReject={setRejectOrder} />
            ) : (
              <OrderCard key={order.id} order={order} mode={key} dense onSelect={setSelectedOrder} onAccept={setAcceptedOrder} onHandoverChamp={setHandoverOrder} onReject={setRejectOrder} />
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
        onClose={() => setHandoverOrder(null)}
        order={handoverOrder?.order}
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
