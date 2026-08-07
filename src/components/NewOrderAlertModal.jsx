import { Clock3, UtensilsCrossed, Bike, ShoppingBag } from 'lucide-react'
import { useOrderTimers } from '../hooks/useOrderTimers'

function relativeJustNow(createdAt) {
  if (!createdAt) return 'Just now'
  const ms = Date.now() - new Date(createdAt).getTime()
  if (Number.isNaN(ms) || ms < 45_000) return 'Just now'
  const mins = Math.max(1, Math.floor(ms / 60_000))
  if (mins < 60) return `${mins}m ago`
  return 'Earlier'
}

function resolveTitle(order, board) {
  const type = String(order?.orderType || '').toUpperCase()
  if (board === 'dinein' || type === 'DINE_IN') return 'New dine-in order'
  if (type === 'PICKUP') return 'New pickup order'
  return 'New delivery order'
}

function resolveIcon(order, board) {
  const type = String(order?.orderType || '').toUpperCase()
  if (board === 'dinein' || type === 'DINE_IN') return UtensilsCrossed
  if (type === 'PICKUP') return ShoppingBag
  return Bike
}

function guestLine(order, board) {
  if (board === 'dinein' || String(order?.orderType || '').toUpperCase() === 'DINE_IN') {
    const guest = order.guest || order.customerName || 'Guest'
    const guests = order.guests != null && order.guests !== '' ? `${order.guests} guests` : null
    return guests ? `${guest} · ${guests}` : guest
  }
  const name = order.customerName || String(order.customer || '').split(' · ')[0] || 'Customer'
  const items = order.items && order.items !== '—' ? order.items : null
  return items ? `${name} · ${items}` : name
}

function PrepTag({ tag }) {
  if (!tag) return null
  const urgent = tag === 'Prepare now'
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        urgent
          ? 'border-[#e8b84a] bg-[#fff8e8] text-[#b7791f]'
          : 'border-[#dfe4e0] bg-[#f3f5f3] text-[#6f7973]'
      }`}
    >
      {urgent ? '🔥 ' : '🕒 '}
      {tag}
    </span>
  )
}

/**
 * Non-blocking top-center new-order alert (notification style).
 * Does not dim or lock the page — vendor can keep working underneath.
 */
export default function NewOrderAlertModal({
  open,
  order,
  board = 'delivery',
  onAccept,
  onReject,
  accepting = false,
  rejecting = false,
}) {
  const { acceptCountdown } = useOrderTimers(order, {
    trackAccept: true,
    trackPrep: false,
  })

  if (!open || !order) return null

  const TitleIcon = resolveIcon(order, board)
  const title = resolveTitle(order, board)
  const busy = accepting || rejecting
  const countdown = acceptCountdown || order.sla || '—'
  const when = order.when || relativeJustNow(order.createdAt)
  const isDineIn = board === 'dinein' || String(order.orderType || '').toUpperCase() === 'DINE_IN'

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[72px] z-[80] flex justify-center px-4 sm:top-[80px]"
      aria-live="polite"
    >
      <div
        role="alertdialog"
        aria-labelledby="new-order-alert-title"
        className="pointer-events-auto w-full max-w-[420px] overflow-hidden rounded-[16px] border border-[#e4e8e4] bg-white shadow-[0_16px_40px_rgba(20,40,28,0.22)]"
      >
        <div className="flex items-center gap-2 border-b border-[#e8f3ec] bg-[#eef8f1] px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#1aa054] shadow-sm">
            <TitleIcon size={16} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="new-order-alert-title" className="text-[15px] font-bold text-[#1a7a4a]">
              {title}
            </h2>
            <p className="text-[11px] font-medium text-[#6f7973]">{relativeJustNow(order.createdAt)}</p>
          </div>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-[#17231c]">{order.id}</p>
              <p className="mt-1 text-[13px] font-semibold text-[#314039]">{guestLine(order, board)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-medium text-[#6f7973]">{when}</span>
                {isDineIn ? <PrepTag tag={order.tag} /> : null}
                {!isDineIn && order.type ? (
                  <span className="inline-flex rounded-full border border-[#dfe4e0] bg-[#f6f8f6] px-2 py-0.5 text-[10px] font-medium text-[#455249]">
                    {order.type}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[11px] font-medium leading-tight text-[#b7791f]">
                Accept within
                <br />
                (SLA 60 sec)
              </p>
              <p className="mt-1 inline-flex items-center justify-end gap-1 text-[28px] font-bold leading-none tracking-tight text-[#b7791f]">
                <Clock3 size={18} strokeWidth={2.4} className="opacity-80" />
                {countdown}
              </p>
            </div>
          </div>

          <p className="text-[12px] text-[#6f7973]">Awaiting your confirmation.</p>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className="inline-flex h-[42px] flex-1 items-center justify-center rounded-[10px] border border-[#e8a0a0] bg-white text-[13px] font-semibold text-[#c54749] hover:bg-[#fff5f5] disabled:opacity-60"
            >
              {rejecting ? 'Rejecting…' : 'Reject'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onAccept}
              className="inline-flex h-[42px] flex-1 items-center justify-center rounded-[10px] bg-[#1aa054] text-[13px] font-semibold text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              {accepting ? 'Accepting…' : 'Accept order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
