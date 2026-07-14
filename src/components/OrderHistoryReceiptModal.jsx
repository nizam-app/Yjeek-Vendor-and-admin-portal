import { useEffect } from 'react'
import { Check } from 'lucide-react'

function formatPrice(price) {
  if (!price) return 'BHD 0.000'
  if (String(price).includes('BHD')) return String(price)
  return `BHD ${String(price).replace(' BHD', '')}`
}

function DashDivider() {
  return (
    <svg width="380" height="1" viewBox="0 0 380 1" className="w-full max-w-full shrink-0" role="separator" aria-hidden="true">
      <line x1="0" y1="0.5" x2="380" y2="0.5" stroke="#CCD1CC" strokeWidth="1" strokeDasharray="5 4" />
    </svg>
  )
}

function MetaRow({ label, value, labelClass = 'text-[12.5px] font-medium text-[#69706E]', valueClass = 'text-[12.5px] font-semibold text-[#1A1A1A]' }) {
  return (
    <div className="flex w-full min-h-[15px] items-center gap-2">
      <span className={`shrink-0 leading-[15px] ${labelClass}`}>{label}</span>
      <span className="min-w-2 flex-1" />
      <span className={`shrink-0 text-right leading-[15px] ${valueClass}`}>{value}</span>
    </div>
  )
}

export default function OrderHistoryReceiptModal({ open, onClose, order }) {
  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || !order) return null

  const items = order.items?.length
    ? order.items
    : [{ qty: 1, name: 'Order item', price: formatPrice(order.total) }]

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[rgba(0,0,0,0.25)]" aria-label="Close receipt" onClick={onClose} />
      <div className="relative h-[457px] w-[440px] max-w-full overflow-hidden rounded-[16px] bg-white shadow-[0px_12px_40px_rgba(0,0,0,0.25)]">
        <div className="flex h-full flex-col gap-3 px-6 pt-6 pb-[22px]">
          <div className="flex flex-col items-start gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-[20px] bg-[#E3F2EB] px-3 py-[5px] text-[11.5px] font-bold leading-[14px] text-[#127036]">
              <Check size={12} strokeWidth={3} />
              PAID
            </span>
            <h2 className="text-[16px] font-bold leading-[19px] text-[#1A1A1A]">{order.branch}</h2>
            <p className="text-[11.5px] font-normal leading-[14px] text-[#949C94]">
              Order {order.id} · {order.when}
            </p>
          </div>

          <DashDivider />

          <div className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <div key={`${item.name}-${idx}`} className="flex w-full min-h-[15px] items-center gap-2">
                <span className="shrink-0 text-[12.5px] font-medium leading-[15px] text-[#69706E]">
                  {item.qty}× {item.name}
                </span>
                <span className="min-w-2 flex-1" />
                <span className="shrink-0 text-[12.5px] font-semibold leading-[15px] text-[#1A1A1A]">{formatPrice(item.price)}</span>
              </div>
            ))}
          </div>

          <DashDivider />

          <div className="flex flex-col gap-[7px]">
            <MetaRow label="Subtotal" value={formatPrice(order.subtotal || order.total)} />
            <MetaRow label="Delivery" value={formatPrice(order.delivery || 'BHD 0.000')} />
            <MetaRow label="VAT (10%)" value={formatPrice(order.vat || 'BHD 1.000')} />
            <div className="flex w-full min-h-[19px] items-center gap-2">
              <span className="shrink-0 text-[14px] font-bold leading-[17px] text-[#1A1A1A]">Total</span>
              <span className="min-w-2 flex-1" />
              <span className="shrink-0 text-[16px] font-bold leading-[19px] text-[#1A1A1A]">{formatPrice(order.total)}</span>
            </div>
            <MetaRow label="Paid" value={order.paid || 'Yjeek Wallet'} />
          </div>

          <div className="mt-auto w-full pt-1">
            <button
              type="button"
              className="h-12 w-full rounded-full bg-green-light-bg text-[14px] font-bold leading-[17px] text-white hover:brightness-[0.96]"
            >
              Print receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
