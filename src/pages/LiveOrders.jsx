import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { PageHeader } from '../components/ui'
import { OrderCard, DineInCard, getColumns } from '../components/OrderCards'
import OrderDetailModal from '../components/OrderDetailModal'
import AcceptOrderModal from '../components/AcceptOrderModal'
import HandoverChampModal from '../components/HandoverChampModal'
import RejectOrderModal from '../components/RejectOrderModal'

export default function LiveOrders() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') === 'dinein' ? 'dinein' : 'delivery')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [acceptedOrder, setAcceptedOrder] = useState(null)
  const [handoverOrder, setHandoverOrder] = useState(null)
  const [rejectOrder, setRejectOrder] = useState(null)
  const isDineIn = tab === 'dinein'

  const columns = getColumns(tab)
  const totalActive = columns.reduce((sum, col) => sum + col.items.length, 0)

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <PageHeader
        title={isDineIn ? 'Dine-in queue' : 'Live orders'}
        subtitle={`${totalActive} active · auto-refresh 8s`}
      />

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="inline-flex bg-[#eef1ee] rounded-[9px] p-[4px]">
          <button
            type="button"
            className={`py-2 px-4 rounded-[7px] text-[13px] font-semibold ${
              !isDineIn ? 'bg-white text-ink shadow-card' : 'text-ink-muted'
            }`}
            onClick={() => setTab('delivery')}
          >
            Delivery & Pickup
          </button>
          <button
            type="button"
            className={`py-2 px-4 rounded-[10px] text-[13px] font-semibold ${
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
        />
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <button type="button" className="border border-border rounded-[8px] py-2 px-[14px] text-[13px] bg-white font-semibold">
          ↻ Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-[14px] max-[1200px]:grid-cols-2">
        {columns.map((col) => (
          <div key={col.key} className="bg-[#eef2ee] rounded-lg py-[14px] px-3 min-h-[520px]">
            <div className="flex items-center justify-between mb-3 font-bold text-sm">
              <span>{col.title}</span>
              <div className="flex items-center gap-2">
                <span className="bg-white rounded-full py-[2px] px-2 text-xs text-ink-muted">{col.items.length}</span>
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
                  <DineInCard key={order.id} order={order} mode={col.key} onSelect={setSelectedOrder} onAccept={setAcceptedOrder} onReject={setRejectOrder} />
                ) : (
                  <OrderCard key={order.id} order={order} mode={col.key} onSelect={setSelectedOrder} onAccept={setAcceptedOrder} onHandoverChamp={setHandoverOrder} onReject={setRejectOrder} />
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
