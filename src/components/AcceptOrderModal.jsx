import { useEffect } from 'react'

function DashDivider() {
  return (
    <svg width="380" height="1" viewBox="0 0 380 1" className="w-[380px] max-w-full shrink-0" role="separator" aria-hidden="true">
      <line x1="0" y1="0.5" x2="380" y2="0.5" stroke="#CCD1CC" strokeWidth="1" strokeDasharray="5 4" />
    </svg>
  )
}

function MetaRow({ label, value, valueClass = 'text-[12.5px] font-medium leading-[15px] text-[#1A1A1A]' }) {
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
      <span className="text-[11px] font-medium leading-[14px] text-[#69706E] shrink-0">×{qty}</span>
      <span className="flex-1 min-w-2" />
      <span className="text-[12.5px] font-medium leading-[15px] text-[#1A1A1A] shrink-0">{price}</span>
    </div>
  )
}

function buildDeliveryReceipt(order) {
  if (order.receipt) return { ...order.receipt, isDineIn: false }

  const customerName = order.customerName || String(order.customer || '').split(' · ')[0] || 'Sara A.'
  const items =
    order.itemsList?.length > 0
      ? order.itemsList.map((item) => ({
          name: item.name,
          qty: item.qty,
          price: item.price.includes('BHD') ? item.price : `BHD ${item.price.replace(' BHD', '')}`,
        }))
      : [
          { name: 'Chicken Shawarma', qty: 2, price: 'BHD 3.600' },
          { name: 'Beef Burger', qty: 1, price: 'BHD 2.900' },
          { name: 'Hummus', qty: 1, price: 'BHD 1.200' },
          { name: 'Soft drink', qty: 2, price: 'BHD 0.800' },
        ]

  const totalRaw = order.total || 'BHD 10.120'
  const total = totalRaw.includes('BHD') ? totalRaw : `BHD ${totalRaw.replace(' BHD', '')}`

  return {
    isDineIn: false,
    badge: 'ORDER ACCEPTED',
    branchName: order.branch || 'Green Kitchen — Seef',
    branchAddress: order.branchAddress || 'Block 338, Road 3801, Seef · CR 12345',
    orderId: order.receiptId || order.id.replace('#', '').replace('…', '') || 'YJK-2YK',
    date: order.date || '16 Jun 2026 · 16:12',
    type: order.receiptType || 'On Demand delivery',
    customer: customerName,
    items,
    subtotal: order.subtotal || 'BHD 8.500',
    delivery: order.deliveryFee || 'BHD 0.700',
    vat: order.vat || 'BHD 0.920',
    vatLabel: 'VAT (10%)',
    total,
    paid: order.paid || 'Card · ending 4421',
  }
}

function buildDineInReceipt(order) {
  if (order.receipt) return { ...order.receipt, isDineIn: true }

  const items =
    order.itemsList?.length > 0
      ? order.itemsList.map((item) => ({
          name: item.name,
          qty: item.qty,
          price: item.price.includes('BHD') ? item.price : `BHD ${item.price.replace(' BHD', '')}`,
        }))
      : [
          { name: 'Mixed Grill Platter', qty: 1, price: 'BHD 12.000' },
          { name: 'Hummus & Bread', qty: 2, price: 'BHD 4.000' },
          { name: 'Fresh Juice', qty: 1, price: 'BHD 4.500' },
        ]

  const totalRaw = order.total || 'BHD 20.500'
  const total = totalRaw.includes('BHD') ? totalRaw : `BHD ${totalRaw.replace(' BHD', '')}`

  return {
    isDineIn: true,
    badge: 'DINE-IN CONFIRMED',
    branchName: order.branch || 'Green Kitchen — Manama',
    branchAddress: order.branchAddress || 'Block 338, Road 3801, Seef · CR 12345',
    orderId: order.receiptId || order.id.replace('#', '') || 'YJK-…70',
    date: order.when || 'Today · 7:30 PM',
    type: 'Dine-in',
    guest: order.guest || 'Sara A.',
    party: order.guests ? `${order.guests} guests` : '2 guests',
    items,
    subtotal: order.subtotal || 'BHD 20.500',
    vat: order.vat || 'BHD 1.864',
    vatLabel: 'VAT (incl. 10%)',
    total,
    paid: order.paid || 'Online · BenefitPay',
  }
}

function buildReceipt(order, tab) {
  return tab === 'dinein' ? buildDineInReceipt(order) : buildDeliveryReceipt(order)
}

export default function AcceptOrderModal({ open, onClose, order, tab = 'delivery' }) {
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

  const receipt = buildReceipt(order, tab)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[rgba(0,0,0,0.25)]" aria-label="Close accept receipt" onClick={onClose} />
      <div className="relative w-[430px] max-w-full bg-white rounded-[16px] shadow-[0px_12px_40px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="flex flex-col items-start px-6 pt-6 pb-[22px] gap-3">
          <div className="flex flex-col items-center gap-2 w-full">
            <span className="inline-flex items-center gap-1.5 py-[5px] px-3 bg-[#E3F2EB] rounded-[20px] text-[11px] font-bold leading-[14px] text-[#127036]">
              ✓ {receipt.badge}
            </span>
            <h2 className="w-full text-[16px] font-bold leading-[19px] text-center text-[#1A1A1A]">{receipt.branchName}</h2>
            <p className="w-full text-[11px] font-normal leading-[13px] text-center text-[#949C94]">{receipt.branchAddress}</p>
          </div>

          <DashDivider />

          <div className="flex flex-col gap-[7px] w-full">
            <MetaRow label="Order #" value={receipt.orderId} />
            <MetaRow label="Date" value={receipt.date} />
            <MetaRow label="Type" value={receipt.type} />
            {receipt.isDineIn ? (
              <>
                <MetaRow label="Guest" value={receipt.guest} />
                <MetaRow label="Party" value={receipt.party} />
              </>
            ) : (
              <MetaRow label="Customer" value={receipt.customer} />
            )}
          </div>

          <DashDivider />

          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-start gap-2 w-full min-h-[13px]">
              <span className="text-[11px] font-bold leading-[13px] text-[#949C94] uppercase">Item</span>
              <span className="flex-1 min-w-2" />
              <span className="text-[11px] font-bold leading-[13px] text-[#949C94] uppercase">Price</span>
            </div>
            {receipt.items.map((item, idx) => (
              <ItemRow key={`${item.name}-${idx}`} name={item.name} qty={item.qty} price={item.price} />
            ))}
          </div>

          <DashDivider />

          <div className="flex flex-col gap-[7px] w-full">
            <MetaRow label="Subtotal" value={receipt.subtotal} />
            {!receipt.isDineIn ? <MetaRow label="Delivery" value={receipt.delivery} /> : null}
            <MetaRow label={receipt.vatLabel || 'VAT (10%)'} value={receipt.vat} />
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
              className="flex-1 h-12 bg-white border-[1.2px] border-[#DBE0DB] rounded-[12px] text-[14px] font-medium leading-[17px] text-[#1A1A1A] hover:bg-[#f7f9f7]"
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
