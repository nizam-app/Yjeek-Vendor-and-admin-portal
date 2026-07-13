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
    <div className="flex items-center gap-2 w-full min-h-[15px]">
      <span className="text-[12.5px] font-medium leading-[15px] text-[#69706E] shrink-0">{label}</span>
      <span className="flex-1 min-w-2" />
      <span className={`${valueClass} text-right shrink-0`}>{value}</span>
    </div>
  )
}

function ItemRow({ name, qty, price }) {
  return (
    <div className="flex items-center gap-2 w-full min-h-[15px]">
      <span className="text-[12.5px] font-medium leading-[15px] text-[#1A1A1A] shrink-0">{name}</span>
      <span className="text-[11.5px] font-semibold leading-[14px] text-[#69706E] shrink-0">×{qty}</span>
      <span className="flex-1 min-w-2" />
      <span className="text-[12.5px] font-semibold leading-[15px] text-[#1A1A1A] shrink-0">{price}</span>
    </div>
  )
}

function formatPrice(price) {
  if (!price) return 'BHD 0.000'
  return price.includes('BHD') ? price : `BHD ${price.replace(' BHD', '')}`
}

function buildScheduledReceipt(order) {
  if (order.receipt) return order.receipt

  const customerName = order.customerName || String(order.customer || '').split(' · ')[0] || 'Sara A.'
  const items =
    order.itemsList?.length > 0
      ? order.itemsList.map((item) => ({
          name: item.name,
          qty: item.qty,
          price: formatPrice(item.price),
        }))
      : [
          { name: 'iPhone 15 pro max', qty: 2, price: 'BHD 300.000' },
          { name: 'iPhone case', qty: 1, price: 'BHD 1.500' },
        ]

  return {
    badge: 'SCHEDULED ORDER',
    branchName: order.branch || 'Green Kitchen — Seef',
    branchAddress: order.branchAddress || 'Block 338, Road 3801, Seef · CR 12345',
    orderId: order.receiptId || order.id.replace('#', '').trim() || 'YJK-…48',
    type: order.deliveryType || `${order.window || 'Same Day'} · scheduled`,
    customer: customerName,
    items,
    subtotal: formatPrice(order.subtotal || 'BHD 301.500'),
    deliveryLabel: order.deliveryLabel || `Delivery (${order.window || 'Same Day'})`,
    delivery: formatPrice(order.deliveryFee || 'BHD 1.500'),
    vat: formatPrice(order.vat || 'BHD 0.500'),
    vatLabel: 'VAT (10%)',
    total: formatPrice(order.total || 'BHD 303.500'),
    paid: order.paid || 'Yjeek Wallet',
  }
}

export default function ScheduledReceiptModal({ open, onClose, order }) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || !order) return null

  const receipt = buildScheduledReceipt(order)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[rgba(0,0,0,0.25)]" aria-label="Close scheduled receipt" onClick={onClose} />
      <div className="relative w-[430px] h-[558px] max-w-full bg-white rounded-[16px] shadow-[0px_12px_40px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="flex flex-col items-start px-6 pt-6 pb-[22px] gap-3">
          <div className="flex flex-col items-center gap-2 w-full">
            <span className="inline-flex items-center gap-1.5 py-[5px] px-3 bg-[#E3F2EB] rounded-[20px] text-[11.5px] font-bold leading-[14px] text-[#127036]">
              ✓ {receipt.badge}
            </span>
            <h2 className="w-full text-[16px] font-bold leading-[19px] text-center text-[#1A1A1A]">{receipt.branchName}</h2>
            <p className="w-full text-[11px] font-normal leading-[13px] text-center text-[#949C94]">{receipt.branchAddress}</p>
          </div>

          <DashDivider />

          <div className="flex flex-col gap-[7px] w-full">
            <MetaRow label="Order #" value={receipt.orderId} />
            <MetaRow label="Type" value={receipt.type} />
            <MetaRow label="Customer" value={receipt.customer} />
          </div>

          <DashDivider />

          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-start gap-2 w-full min-h-[13px]">
              <span className="text-[10.5px] font-bold leading-[13px] text-[#949C94] uppercase">Item</span>
              <span className="flex-1 min-w-2" />
              <span className="text-[10.5px] font-bold leading-[13px] text-[#949C94] uppercase">Price</span>
            </div>
            {receipt.items.map((item, idx) => (
              <ItemRow key={`${item.name}-${idx}`} name={item.name} qty={item.qty} price={item.price} />
            ))}
          </div>

          <DashDivider />

          <div className="flex flex-col gap-[7px] w-full">
            <MetaRow label="Subtotal" value={receipt.subtotal} />
            <MetaRow label={receipt.deliveryLabel} value={receipt.delivery} />
            <MetaRow label={receipt.vatLabel} value={receipt.vat} />
            <div className="flex items-center gap-2 w-full min-h-[19px]">
              <span className="text-[14px] font-bold leading-[17px] text-[#1A1A1A] shrink-0">Total</span>
              <span className="flex-1 min-w-2" />
              <span className="text-[16px] font-bold leading-[19px] text-[#1A1A1A] shrink-0">{receipt.total}</span>
            </div>
            <MetaRow label="Paid" value={receipt.paid} />
          </div>

          <DashDivider />

          <div className="flex gap-3 w-full h-12">
            <button
              type="button"
              className="flex-1 h-12 bg-white border-[1.2px] border-[#DBE0DB] rounded-[12px] text-[14px] font-semibold leading-[17px] text-[#1A1A1A] hover:bg-[#f7f9f7]"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 h-12 bg-[#1A8C45] rounded-[12px] text-[14px] font-bold leading-[17px] text-white hover:brightness-[0.96]"
            >
              Print receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
