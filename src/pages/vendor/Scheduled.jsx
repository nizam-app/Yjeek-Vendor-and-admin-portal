import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import { ScheduleCard, getScheduledColumns } from '../../components/ScheduledOrderCards'
import ScheduledOrderModal from '../../components/ScheduledOrderModal'
import ScheduledReceiptModal from '../../components/ScheduledReceiptModal'
import ScheduledRejectOrderModal from '../../components/ScheduledRejectOrderModal'
import HandoverChampModal from '../../components/HandoverChampModal'
import { useVendorScheduledOrders } from '../../hooks/vendor/useVendorScheduledOrders'

export default function Scheduled() {
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [receiptOrder, setReceiptOrder] = useState(null)
  const [rejectOrder, setRejectOrder] = useState(null)
  const [handoverOrder, setHandoverOrder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { data, error, isLoading, refetch } = useVendorScheduledOrders({ date: 'today' })

  const columns = getScheduledColumns(data).map((col) => ({
    ...col,
    items: col.items.filter((order) => {
      if (!searchQuery.trim()) return true
      const haystack = [order.id, order.customer, order.customerName, order.itemsPreview]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(searchQuery.trim().toLowerCase())
    }),
  }))

  if (isLoading && !data) {
    return <div className="p-7 text-[13px] text-ink-muted">Loading scheduled orders…</div>
  }
  if (error && !data) {
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load scheduled orders.{' '}
        <button type="button" onClick={refetch} className="underline">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <PageHeader
        title="Scheduled orders"
        subtitle={typeof data?.count === 'number' ? `${data.count} scheduled` : undefined}
      />

      <div className="flex items-center justify-end gap-3 mb-4 flex-wrap">
        {error ? (
          <p className="text-[12px] text-danger mr-auto">
            Refresh failed.{' '}
            <button type="button" onClick={refetch} className="underline">
              Retry
            </button>
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => refetch()}
          className="border border-border rounded-[8px] h-10 px-[14px] text-xs bg-white font-medium hover:bg-[#f7f9f7]"
        >
          ↻ Refresh
        </button>
        <input
          className="border border-border rounded-[8px] h-10 px-[14px] text-xs bg-white min-w-[220px]"
          placeholder="Search by order #…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-4 gap-[14px] max-[1200px]:grid-cols-2">
        {columns.map((col) => (
          <div key={col.key} className="bg-[#eef2ee] rounded-lg py-[14px] px-3 min-h-[520px] flex flex-col gap-2.5">
            <div className="flex items-center justify-between mb-3 font-bold text-sm">
              <span>{col.title}</span>
              <div className="flex items-center gap-2">
                <span className="bg-white rounded-full py-[2px] px-[7px] text-[11px] font-medium text-ink-muted">
                  {col.items.length}
                </span>
                <Link
                  to={`/scheduled/${col.key}`}
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
              col.items.map((order, idx) => (
                <ScheduleCard
                  key={`${order.backendId || order.id}-${idx}`}
                  order={order}
                  columnKey={col.key}
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
              ))
            )}
          </div>
        ))}
      </div>

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
