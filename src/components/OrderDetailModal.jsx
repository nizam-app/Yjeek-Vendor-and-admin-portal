import { useEffect } from 'react'
import { X } from 'lucide-react'

const statusTones = {
  NEW: 'bg-warn-soft text-warn border-warn',
  ACCEPTED: 'bg-[#ebf2ff] text-[#2978db] border-[#2978db]',
  PREPARING: 'bg-[#ebf2ff] text-[#2978db] border-[#2978db]',
  READY: 'bg-green-active-bg text-green-active-text border-green-active-text',
  CONFIRMED: 'bg-[#ebf2ff] text-[#2978db] border-[#2978db]',
  REJECTED: 'bg-danger-soft text-danger border-danger',
  'NO-SHOW': 'bg-danger-soft text-danger border-danger',
}

const statusLabels = {
  NEW: { header: 'NEW', body: 'New' },
  ACCEPTED: { header: 'ACCEPTED', body: 'Accepted' },
  PREPARING: { header: 'PREPARING', body: 'Preparing' },
  READY: { header: 'READY', body: 'Ready' },
  CONFIRMED: { header: 'CONFIRMED', body: 'Confirmed' },
  REJECTED: { header: 'REJECTED', body: 'Rejected' },
  'NO-SHOW': { header: 'NO-SHOW', body: 'No-show' },
}

const modeStatus = {
  new: 'NEW',
  accepted: 'ACCEPTED',
  preparing: 'PREPARING',
  ready: 'READY',
  confirmed: 'CONFIRMED',
}

const fieldLabel = 'text-[13px] font-medium text-ink-muted uppercase tracking-[0.04em]'
const fieldValue = 'text-[13px] font-medium text-ink'

function StatusBadge({ status, variant = 'header' }) {
  const key = String(status || '').toUpperCase()
  const label = statusLabels[key]?.[variant] || status
  return (
    <span
      className={`inline-flex items-center rounded-full border py-[3px] px-[10px] text-[10px] font-bold ${
        variant === 'header' ? 'uppercase' : ''
      } ${statusTones[key] || 'bg-[#f2f2f2] text-ink-muted border-border'}`}
    >
      {label}
    </span>
  )
}

function buildDeliveryDetails(order, mode) {
  const customerParts = String(order.customer || '').split(' · ')
  const customerName = order.customerName || customerParts[0] || 'Customer'
  const customerPhone = order.customerPhone || '+973 3300 0000'
  const status =
    order.status === 'rejected'
      ? 'REJECTED'
      : order.status === 'no-show-cancelled'
        ? 'NO-SHOW'
        : modeStatus[mode] || 'NEW'

  const itemsList =
    order.itemsList ||
    (order.items
      ? [
          {
            qty: 1,
            name: order.items,
            price: order.total || '—',
          },
        ]
      : [])

  return {
    title: `Order ${order.id}`,
    status,
    branch: order.branch || 'Green Kitchen — Manama',
    customerLine: `${customerName} · ${customerPhone}`,
    address: order.address || (order.type === 'Pickup' ? 'Pickup at branch counter' : 'Home • Adliya, Bldg 23, Road 3825, Flat 82'),
    orderType: order.orderType || (order.type ? `${order.type} - On demand` : 'Delivery - On demand'),
    prepTime: order.prepTimeRequired ? `Required: ${order.prepTimeRequired}` : order.prepTime ? `Elapsed: ${order.prepTime}` : null,
    note: order.customerNote || order.note || order.reason || null,
    slaLabel:
      order.sla && status === 'NEW'
        ? 'Accept within (SLA 60 sec)'
        : order.prepTime && status === 'PREPARING'
          ? 'Prep time'
          : null,
    slaValue: order.sla || order.prepTime || null,
    itemsList,
    total: order.total || '—',
    isDineIn: false,
  }
}

function DineInPrepTag({ tag }) {
  if (!tag) return null
  const isUrgent = tag === 'Prepare now'
  return (
    <span
      className={`inline-flex w-fit items-center text-[10px] font-medium py-[3px] px-[9px] rounded-full border ${
        isUrgent ? 'bg-warn-soft text-warn border-warn' : 'bg-[#f2f2f2] text-ink-muted border-ink-muted'
      }`}
    >
      {isUrgent ? '🔥' : '🕒'} {tag}
    </span>
  )
}

function buildDineInDetails(order, mode) {
  const status = modeStatus[mode] || 'NEW'
  const defaultItems = [
    { qty: 1, name: 'Mixed Grill Platter', price: '12.000 BHD' },
    { qty: 2, name: 'Hummus & Bread', price: '4.000 BHD' },
    { qty: 2, name: 'Fresh Juice', price: '4.500 BHD' },
  ]

  return {
    title: `Dine-in order ${order.id}`,
    status,
    prepTag: order.tag || null,
    guestLine: `${order.guest || 'Sara A.'} · ${order.guestPhone || '+973 3300 0000'}`,
    partySize: order.guests ? `${order.guests} guests` : '2 guests',
    dineInTime: order.when || 'Today · 7:30 PM',
    venue: order.branch || 'Green Kitchen — Manama',
    payment: order.payment || 'Paid online · BenefitPay',
    note: order.customerNote || order.note || (mode === 'confirmed' ? 'No high chair needed · celebrating a birthday 🎂' : null),
    slaLabel: order.sla && status === 'NEW' ? 'Accept within (SLA 60 sec)' : null,
    slaValue: order.sla || null,
    itemsList: order.itemsList?.length > 0 ? order.itemsList : defaultItems,
    total: order.total || '20.500 BHD',
    isDineIn: true,
  }
}

export default function OrderDetailModal({ open, onClose, order, mode, tab }) {
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

  const details = tab === 'dinein' ? buildDineInDetails(order, mode) : buildDeliveryDetails(order, mode)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[rgba(26,28,26,0.45)]" aria-label="Close order details" onClick={onClose} />
      <div
        className={`relative w-full max-w-[860px] bg-white rounded-[14px] shadow-[0_18px_40px_rgba(26,28,26,0.18)] overflow-hidden ${
          details.isDineIn ? '' : 'border border-warn'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-[18px] font-bold text-ink truncate">{details.title}</h2>
            <StatusBadge status={details.status} variant="header" />
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-[8px] border-0 bg-transparent text-ink-muted hover:bg-[#f7f9f7] grid place-items-center shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {details.isDineIn && details.prepTag ? (
          <div className="px-6 pt-4">
            <DineInPrepTag tag={details.prepTag} />
          </div>
        ) : null}

        <div className={`grid grid-cols-[1.15fr_0.85fr] max-[760px]:grid-cols-1 px-6 ${details.isDineIn && details.prepTag ? 'pt-4' : 'pt-5'} pb-4 gap-5`}>
          <div className="pr-5 max-[760px]:pr-0 max-[760px]:pb-5">
            <div className="grid gap-4">
              {details.isDineIn ? (
                <>
                  <div>
                    <p className={fieldLabel}>Guest</p>
                    <p className={`${fieldValue} mt-1`}>{details.guestLine}</p>
                  </div>
                  <div>
                    <p className={fieldLabel}>Party size</p>
                    <p className={`${fieldValue} mt-1`}>{details.partySize}</p>
                  </div>
                  <div>
                    <p className={fieldLabel}>Dine-in time</p>
                    <p className={`${fieldValue} mt-1`}>{details.dineInTime}</p>
                  </div>
                  <div>
                    <p className={fieldLabel}>Venue</p>
                    <p className={`${fieldValue} mt-1`}>{details.venue}</p>
                  </div>
                  <div>
                    <p className={fieldLabel}>Payment</p>
                    <p className={`${fieldValue} mt-1`}>{details.payment}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className={fieldLabel}>Status</p>
                    <div className="mt-1">
                      <StatusBadge status={details.status} variant="body" />
                    </div>
                  </div>
                  <div>
                    <p className={fieldLabel}>Branch</p>
                    <p className={`${fieldValue} mt-1`}>{details.branch}</p>
                  </div>
                  <div>
                    <p className={fieldLabel}>Customer</p>
                    <p className={`${fieldValue} mt-1`}>{details.customerLine}</p>
                  </div>
                  <div>
                    <p className={fieldLabel}>Delivery address</p>
                    <p className={`${fieldValue} mt-1 leading-[1.45]`}>{details.address}</p>
                  </div>
                  <div>
                    <p className={fieldLabel}>Type</p>
                    <p className={`${fieldValue} mt-1`}>{details.orderType}</p>
                  </div>
                  {details.prepTime ? (
                    <div>
                      <p className={fieldLabel}>Prep time</p>
                      <p className={`${fieldValue} mt-1`}>{details.prepTime}</p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div>
            <p className={`${fieldLabel} mb-3`}>Items</p>
            {details.itemsList.length > 0 ? (
              <div className={`flex flex-col ${details.isDineIn ? 'gap-3' : 'gap-2'}`}>
                {details.itemsList.map((item, idx) =>
                  details.isDineIn ? (
                    <div key={`${item.name}-${idx}`} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="text-ink font-medium min-w-0 truncate">
                        <span className="text-green-primary font-bold">{item.qty}×</span> {item.name}
                      </span>
                      <span className="text-ink font-medium whitespace-nowrap">{item.price}</span>
                    </div>
                  ) : (
                    <div
                      key={`${item.name}-${idx}`}
                      className="flex items-center justify-between gap-3 h-9 px-3 rounded-[8px] bg-[#f0f2f0] text-[13px]"
                    >
                      <span className="text-ink font-medium min-w-0 truncate">
                        <span className="text-green-active-text font-bold">{item.qty}×</span> {item.name}
                      </span>
                      <span className="text-ink font-medium whitespace-nowrap">{item.price}</span>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-[13px] text-ink-muted">No item breakdown available.</p>
            )}

            {details.total ? (
              <div className={`mt-4 flex items-center justify-between ${details.isDineIn ? 'pt-3 border-t border-border' : 'pt-3'}`}>
                <span className="text-[14px] font-bold text-ink">Total</span>
                <span className="text-[16px] font-bold text-green-primary">{details.total}</span>
              </div>
            ) : null}
          </div>
        </div>

        {details.isDineIn && details.status === 'CONFIRMED' ? (
          <div className="mx-6 mb-3 flex items-center justify-between gap-4 rounded-[10px] bg-[#E7F6E7] px-5 py-4">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#127338]">Verify the guest by order number</p>
              <p className="mt-1 text-[12px] leading-[1.45] text-[#3d6b4f]">
                Ask the guest to show this at the counter on arrival, then complete.
              </p>
            </div>
            <p className="text-[20px] font-bold leading-none text-[#127338] shrink-0">{order.id}</p>
          </div>
        ) : null}

        {details.note ? (
          <div
            className={`mx-6 mb-4 flex items-center gap-2 rounded-[10px] px-4 py-3 text-[12.5px] leading-[1.45] ${
              details.isDineIn ? ' bg-[#FFF4E5] text-[#8a5a12]' : 'items-start bg-warn-soft text-[#8a5a12]'
            }`}
          >
            <span className="shrink-0">📝</span>
            <span>{details.note}</span>
          </div>
        ) : null}

        {details.slaLabel && details.slaValue ? (
          <div className="border-t border-border px-6 py-4">
            <p className="text-[12px] font-medium text-warn">{details.slaLabel}</p>
            <p className="text-[20px] font-bold leading-none text-warn mt-1">{details.slaValue}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
