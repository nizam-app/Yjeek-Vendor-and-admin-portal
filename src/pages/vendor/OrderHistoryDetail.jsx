import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { StatusPill } from '../../components/ui'
import { useApiResource } from '../../hooks/useApiResource'
import { vendorService } from '../../services/vendorService'

function formatPrice(price) {
  if (!price) return 'BHD 0.000'
  if (price.includes('BHD')) return price
  return `BHD ${String(price).replace(' BHD', '')}`
}

function findOrder(orderHistory, orderIdParam) {
  if (!orderIdParam) return null
  const decoded = decodeURIComponent(orderIdParam)
  return (
    orderHistory.find((order) => order.id === decoded) ||
    orderHistory.find((order) => order.id === `#${decoded}`) ||
    orderHistory.find((order) => order.id.replace('#', '') === decoded.replace('#', ''))
  )
}

export default function OrderHistoryDetail() {
  const { orderId } = useParams()
  const { data: orderHistory, error, isLoading, refetch } = useApiResource(() => vendorService.getOrderHistory(), [])
  const order = findOrder(orderHistory || [], orderId)

  if (isLoading) return <div className="p-7 text-[13px] text-ink-muted">Loading order…</div>
  if (error) return <div className="p-7 text-[13px] text-danger">Unable to load order. <button onClick={refetch} className="underline">Try again</button></div>

  if (!order) {
    return (
      <div className="px-[28px] pt-[26px] pb-10">
        <Link
          to="/orders-history"
          className="mb-[14px] inline-flex items-center gap-[6px] text-[13px] font-medium text-green-primary hover:underline"
        >
          <ArrowLeft size={14} strokeWidth={2.2} />
          Orders
        </Link>
        <p className="text-[14px] text-ink-muted">Order not found.</p>
      </div>
    )
  }

  const items = order.items || []
  const timeline = order.timeline || []

  return (
    <div className="px-[28px] pt-[26px] pb-10">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link
          to="/orders-history"
          className="inline-flex items-center gap-1 rounded-[18px] border border-[#e0e5e0] bg-white py-1.5 pl-2.5 pr-3.5 text-[12px] font-medium text-ink-muted hover:bg-[#fafbfa]"
        >
          <ArrowLeft size={14} strokeWidth={2.2} />
          Orders
        </Link>
        <h1 className="text-[20px] font-bold tracking-[-0.02em] text-ink">Order {order.id}</h1>
        <StatusPill status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <section className="rounded-[14px] border border-border bg-white p-5">
            <h2 className="mb-4 text-[16px] font-bold text-ink">Order summary</h2>
            <div className="flex flex-col gap-3">
              {[
                ['Type', order.type],
                ['Branch', order.branch],
                ['Customer', order.customer],
                ['Placed', order.when],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center gap-3 justify-between">
                  <span className="w-[90px] shrink-0 text-[13px] text-ink-muted">{label}</span>
                  <span className="text-[13px] font-medium text-ink">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[14px] border border-border bg-white p-5">
            <h2 className="mb-4 text-[16px] font-bold text-ink">Items</h2>
            <div className="flex flex-col gap-3">
              {items.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="flex items-center gap-3">
                  <span className="text-[13px] text-ink">
                    {item.qty}× {item.name}
                  </span>
                  <span className="min-w-2 flex-1" />
                  <span className="text-[13px] font-medium text-ink">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center border-t border-border pt-4">
              <span className="text-[14px] font-bold text-ink">Total</span>
              <span className="min-w-2 flex-1" />
              <span className="text-[14px] font-bold text-ink">{formatPrice(order.total)}</span>
            </div>
          </section>
        </div>

        <section className="h-fit rounded-[14px] border border-border bg-white p-5 pb-0">
          <h2 className="mb-4 text-[16px] font-bold text-ink">Timeline</h2>
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {timeline.map((event, idx) => (
              <li key={`${event.label}-${idx}`} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-green-primary">
                  <Check size={11} strokeWidth={3} className="text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">{event.label}</p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">{event.time}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center border-t border-border pt-4"></div>
        </section>
      </div>
    </div>
  )
}
