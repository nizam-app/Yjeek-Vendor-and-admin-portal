import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ScheduleCard, getScheduledColumns } from '../components/ScheduledOrderCards'
import ScheduledOrderModal from '../components/ScheduledOrderModal'
import ScheduledReceiptModal from '../components/ScheduledReceiptModal'
import ScheduledRejectOrderModal from '../components/ScheduledRejectOrderModal'
import HandoverChampModal from '../components/HandoverChampModal'

export default function ScheduledOrderColumn() {
  const { key } = useParams()
  const [query, setQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [receiptOrder, setReceiptOrder] = useState(null)
  const [rejectOrder, setRejectOrder] = useState(null)
  const [handoverOrder, setHandoverOrder] = useState(null)

  const column = getScheduledColumns().find((col) => col.key === key)
  const items = column
    ? column.items.filter((order) =>
        [order.id, order.customer, order.customerName, ...(order.itemsList?.map((item) => item.name) || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : []

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <Link
        to="/scheduled"
        className="inline-flex items-center gap-[6px] text-green-primary text-[13px] font-medium mb-[14px] hover:underline"
      >
        <ArrowLeft size={14} strokeWidth={2.2} />
        Back to scheduled orders
      </Link>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.02em] flex items-center gap-2.5">
            {column ? column.title : 'Not found'}
            <span className="bg-[#eef1ee] text-ink-muted text-[13px] font-bold rounded-full py-[2px] px-[10px]">
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
        <button
          type="button"
          className="border border-border rounded-md py-[10px] px-[14px] text-[13px] bg-white font-medium text-ink shrink-0"
        >
          Sort: Window
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-ink-muted text-[13px] p-6 text-center">No orders</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[14px]">
          {items.map((order, idx) => (
            <ScheduleCard
              key={`${order.id}-${idx}`}
              order={order}
              columnKey={key}
              dense
              onSelect={setSelectedOrder}
              onReject={({ order: rejectTarget }) => setRejectOrder(rejectTarget)}
              onAction={({ order: actionOrder, columnKey }) => {
                if (columnKey === 'readyForPickup') {
                  setHandoverOrder(actionOrder)
                  return
                }
                setReceiptOrder(actionOrder)
              }}
            />
          ))}
        </div>
      )}

      <ScheduledOrderModal
        open={Boolean(selectedOrder?.order)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder?.order}
        columnKey={selectedOrder?.columnKey}
      />

      <ScheduledReceiptModal
        open={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
      />

      <ScheduledRejectOrderModal
        open={Boolean(rejectOrder)}
        onClose={() => setRejectOrder(null)}
        order={rejectOrder}
      />

      <HandoverChampModal
        open={Boolean(handoverOrder)}
        onClose={() => setHandoverOrder(null)}
        order={handoverOrder}
      />
    </div>
  )
}
