import { Bell } from 'lucide-react'
import { useNow } from '../hooks/useNow'

function shortRelative(createdAt, now) {
  if (!createdAt) return 'now'
  const ms = now - new Date(createdAt).getTime()
  if (Number.isNaN(ms) || ms < 45_000) return 'now'
  const mins = Math.max(1, Math.floor(ms / 60_000))
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return 'earlier'
}

function typeMeta(order, board) {
  const type = String(order?.orderType || '').toUpperCase()
  if (board === 'dinein' || type === 'DINE_IN') {
    return { label: 'Dine-in', className: 'bg-[#f3e8ff] text-[#7c3aed]' }
  }
  if (type === 'PICKUP') {
    return { label: 'Pickup', className: 'bg-[#e8f2ff] text-[#2563eb]' }
  }
  return { label: 'Delivery', className: 'bg-[#fff1e0] text-[#c2410c]' }
}

function detailLine(order, board) {
  const type = String(order?.orderType || '').toUpperCase()
  const isDineIn = board === 'dinein' || type === 'DINE_IN'
  const name = isDineIn
    ? order.guest || order.customerName || 'Guest'
    : order.customerName || String(order.customer || '').split(' · ')[0] || 'Customer'
  const items = order.items && order.items !== '—' ? String(order.items) : null
  if (items) return `${items} · ${name}`
  if (isDineIn && order.guests != null && order.guests !== '') {
    return `${order.guests} guests · ${name}`
  }
  return name
}

function ToastCard({ item, index, total, onSelect }) {
  const now = useNow(true)
  const { order, board, key } = item
  const type = typeMeta(order, board)
  const fade = total > 2 && index === total - 1

  return (
    <button
      type="button"
      onClick={() => onSelect?.(key)}
      className={`flex w-full max-w-[320px] items-start gap-2.5 rounded-[12px] border border-[#e8ece8] bg-white px-3 py-2.5 text-left shadow-[0_8px_24px_rgba(20,40,28,0.14)] transition hover:border-[#cfe0d4] hover:bg-[#fbfcfb] ${
        fade ? 'opacity-70' : 'opacity-100'
      }`}
    >
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#fff6e0] text-[#d4a017]">
        <Bell size={14} strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-[#17231c]">
            New order · {order.id}
          </span>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${type.className}`}
          >
            {type.label}
          </span>
          <span className="shrink-0 text-[11px] font-medium text-[#8a948e]">
            {shortRelative(order.createdAt, now)}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-[#6f7973]">
          {detailLine(order, board)}
        </span>
      </span>
    </button>
  )
}

/**
 * Right-side stacked toasts for additional incoming orders
 * while the primary alert is already open.
 */
export default function NewOrderToastStack({ items = [], onSelect }) {
  if (!items.length) return null

  return (
    <div
      className="pointer-events-none fixed right-4 top-[72px] z-[81] flex max-h-[calc(100vh-96px)] w-[min(100vw-2rem,320px)] flex-col gap-2 overflow-y-auto sm:right-5 sm:top-[80px]"
      aria-live="polite"
    >
      {items.map((item, index) => (
        <div key={item.key} className="pointer-events-auto">
          <ToastCard item={item} index={index} total={items.length} onSelect={onSelect} />
        </div>
      ))}
    </div>
  )
}
