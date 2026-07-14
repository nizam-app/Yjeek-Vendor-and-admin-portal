import { useEffect } from 'react'

function DashDivider() {
  return (
    <svg width="380" height="1" viewBox="0 0 380 1" className="w-[380px] max-w-full shrink-0" role="separator" aria-hidden="true">
      <line x1="0" y1="0.5" x2="380" y2="0.5" stroke="#CCD1CC" strokeWidth="1" strokeDasharray="5 4" />
    </svg>
  )
}

function MetaRow({ label, value, valueClass = 'text-[12.5px] font-semibold leading-[15px] text-[#1A1A1A]' }) {
  return (
    <div className="flex w-full min-h-[15px] items-center gap-2">
      <span className="shrink-0 text-[12.5px] font-medium leading-[15px] text-[#69706E]">{label}</span>
      <span className="min-w-2 flex-1" />
      <span className={`${valueClass} shrink-0 text-right`}>{value}</span>
    </div>
  )
}

function ServiceRow({ name, qty, price }) {
  return (
    <div className="flex w-full min-h-[15px] items-center gap-2">
      <span className="shrink-0 text-[12.5px] font-medium leading-[15px] text-[#1A1A1A]">{name}</span>
      <span className="shrink-0 text-[11.5px] font-semibold leading-[14px] text-[#69706E]">×{qty}</span>
      <span className="min-w-2 flex-1" />
      <span className="shrink-0 text-[12.5px] font-semibold leading-[15px] text-[#1A1A1A]">{price}</span>
    </div>
  )
}

function formatPrice(price) {
  if (!price) return 'BHD 0.000'
  return price.includes('BHD') ? price : `BHD ${price.replace(' BHD', '')}`
}

function buildServiceReceipt(order) {
  if (order.receipt) return order.receipt

  const items =
    order.servicesList?.length > 0
      ? order.servicesList.map((item) => ({
          name: item.name,
          qty: item.qty,
          price: formatPrice(item.price),
        }))
      : [
          { name: 'Haircut & styling', qty: 2, price: 'BHD 3.600' },
          { name: 'Scalp massage', qty: 1, price: 'BHD 1.500' },
          { name: 'Hair treatment', qty: 1, price: 'BHD 1.200' },
        ]

  return {
    badge: 'service booking',
    branchName: order.branch || 'Green Kitchen — Seef',
    branchAddress: order.branchAddress || 'Block 338, Road 3801, Seef · CR 12345',
    bookingId: order.receiptId || order.id.replace('#', '').trim() || 'YJK-…48',
    type: order.bookingType || `${order.category || 'Salon & Beauty'} · booking`,
    customer: order.customer || 'Sara A.',
    items,
    subtotal: formatPrice(order.subtotal || 'BHD 6.300'),
    serviceFee: formatPrice(order.serviceFee || 'BHD 1.200'),
    vat: formatPrice(order.vat || 'BHD 0.750'),
    vatLabel: 'VAT (10%)',
    total: formatPrice(order.total || 'BHD 8.250'),
    paid: order.paid || 'Yjeek Wallet',
  }
}

export default function ServiceAcceptBookingModal({ open, onClose, order }) {
  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || !order) return null

  const receipt = buildServiceReceipt(order)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[rgba(0,0,0,0.25)]" aria-label="Close service receipt" onClick={onClose} />
      <div className="relative h-[558px] w-[430px] max-w-full overflow-hidden rounded-[16px] bg-white shadow-[0px_12px_40px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col items-start gap-3 px-6 pb-[22px] pt-6">
          <div className="flex w-full flex-col items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-[20px] bg-[#E3F2EB] px-3 py-[5px] text-[11.5px] font-bold leading-[14px] text-[#127036]">
              ✓ {receipt.badge}
            </span>
            <h2 className="w-full text-center text-[16px] font-bold leading-[19px] text-[#1A1A1A]">{receipt.branchName}</h2>
            <p className="w-full text-center text-[11px] font-normal leading-[13px] text-[#949C94]">{receipt.branchAddress}</p>
          </div>

          <DashDivider />

          <div className="flex w-full flex-col gap-[7px]">
            <MetaRow label="Booking #" value={receipt.bookingId} />
            <MetaRow label="Type" value={receipt.type} />
            <MetaRow label="Customer" value={receipt.customer} />
          </div>

          <DashDivider />

          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full min-h-[13px] items-start gap-2">
              <span className="text-[10.5px] font-bold uppercase leading-[13px] text-[#949C94]">Service</span>
              <span className="min-w-2 flex-1" />
              <span className="text-[10.5px] font-bold uppercase leading-[13px] text-[#949C94]">Price</span>
            </div>
            {receipt.items.map((item, index) => (
              <ServiceRow key={`${item.name}-${index}`} name={item.name} qty={item.qty} price={item.price} />
            ))}
          </div>

          <DashDivider />

          <div className="flex w-full flex-col gap-[7px]">
            <MetaRow label="Subtotal" value={receipt.subtotal} />
            <MetaRow label="Service fee" value={receipt.serviceFee} />
            <MetaRow label={receipt.vatLabel} value={receipt.vat} />
            <div className="flex w-full min-h-[19px] items-center gap-2">
              <span className="shrink-0 text-[14px] font-bold leading-[17px] text-[#1A1A1A]">Total</span>
              <span className="min-w-2 flex-1" />
              <span className="shrink-0 text-[16px] font-bold leading-[19px] text-[#1A1A1A]">{receipt.total}</span>
            </div>
            <MetaRow label="Paid" value={receipt.paid} />
          </div>

          <DashDivider />

          <div className="flex h-12 w-full gap-3">
            <button
              type="button"
              className="h-12 flex-1 rounded-[12px] border-[1.2px] border-[#DBE0DB] bg-white text-[14px] font-semibold leading-[17px] text-[#1A1A1A] hover:bg-[#f7f9f7]"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="h-12 flex-1 rounded-[12px] bg-[#1A8C45] text-[14px] font-bold leading-[17px] text-white hover:brightness-[0.96]"
            >
              Print receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
