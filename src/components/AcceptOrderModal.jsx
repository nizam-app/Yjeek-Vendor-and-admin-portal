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

  const customerName = order.customerName || String(order.customer || '').split(' · ')[0] || '—'
  const items =
    order.itemsList?.length > 0
      ? order.itemsList.map((item) => ({
          name: item.name,
          qty: item.qty,
          price:
            typeof item.price === 'string' && item.price.includes('BHD')
              ? item.price
              : `BHD ${String(item.price || '').replace(/ BHD/i, '')}`,
        }))
      : []

  const totalRaw = order.total || '—'
  const total = typeof totalRaw === 'string' && totalRaw.includes('BHD') ? totalRaw : String(totalRaw)
  const dateSource = order.confirmedAt || order.createdAt || order.date
  let date = order.date || '—'
  if (dateSource && !order.date) {
    const d = new Date(dateSource)
    if (!Number.isNaN(d.getTime())) {
      date = d.toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  const typeLabel =
    order.fulfillmentType === 'ON_DEMAND'
      ? 'On Demand delivery'
      : order.orderType
        ? String(order.orderType)
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : order.receiptType || 'Delivery'

  return {
    isDineIn: false,
    badge: 'ORDER ACCEPTED',
    branchName: order.branch || '—',
    branchAddress:
      order.branchAddress ||
      (order.branchArea ? `${order.branchArea}` : '') ||
      order.deliveryAddress?.formatted ||
      '',
    orderId: order.orderNumber || order.receiptId || order.id || '—',
    date,
    type: typeLabel,
    customer: customerName,
    items,
    subtotal: order.subtotal || '—',
    delivery: order.deliveryFee || 'BHD 0.000',
    vat: order.vat || '—',
    vatLabel: 'VAT (10%)',
    total,
    paid: order.paid || order.paymentMethod || '—',
  }
}

function buildDineInReceipt(order) {
  if (order.receipt) return { ...order.receipt, isDineIn: true }

  const items =
    order.itemsList?.length > 0
      ? order.itemsList.map((item) => ({
          name: item.name,
          qty: item.qty,
          price:
            typeof item.price === 'string' && item.price.includes('BHD')
              ? item.price
              : `BHD ${String(item.price || '').replace(/ BHD/i, '')}`,
        }))
      : []

  const totalRaw = order.total || '—'
  const total = typeof totalRaw === 'string' && totalRaw.includes('BHD') ? totalRaw : String(totalRaw)
  const dateSource = order.confirmedAt || order.createdAt || order.when
  let date = order.when || '—'
  if (dateSource && !order.when) {
    const d = new Date(dateSource)
    if (!Number.isNaN(d.getTime())) {
      date = d.toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  return {
    isDineIn: true,
    badge: 'DINE-IN CONFIRMED',
    branchName: order.branch || '—',
    branchAddress: order.branchAddress || (order.branchArea ? `${order.branchArea}` : '') || '',
    orderId: order.orderNumber || order.receiptId || order.id || '—',
    date,
    type: 'Dine-in',
    guest: order.guest || order.customerName || '—',
    party: order.guests != null ? `${order.guests} guests` : '—',
    items,
    subtotal: order.subtotal || '—',
    vat: order.vat || '—',
    vatLabel: 'VAT (incl. 10%)',
    total,
    paid: order.paid || order.paymentMethod || '—',
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-6" role="dialog" aria-modal="true">
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
