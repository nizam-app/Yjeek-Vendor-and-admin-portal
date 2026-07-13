import { useEffect } from 'react'
import { Check, X } from 'lucide-react'
import motoBike from '../assets/moto_bike.png'

const fieldLabel = 'text-[10px] font-bold text-[#949C94] uppercase tracking-[0.04em]'
const fieldValue = 'text-[13px] font-semibold text-[#1A1A1A]'

const windowTones = {
  blue: 'bg-[#E5F0FF] text-[#2978DB]',
  purple: 'bg-[#EDE3FA] text-[#704DBF]',
  orange: 'bg-[#FFF0D9] text-[#D98C1A]',
  gray: 'bg-[#EDEDED] text-[#69706E]',
}

const columnModalConfig = {
  new: {
    showStatusBadge: false,
    showDeliveryWindow: false,
    showPrepTime: true,
    headerBorder: true,
  },
  confirmed: {
    showStatusBadge: true,
    statusLabel: 'Confirmed',
    statusTone: 'bg-[#E3F2EB] text-[#127036]',
    showDeliveryWindow: true,
    showPrepTime: false,
    headerBorder: true,
    banner: {
      tone: 'bg-[#E7F6E7] text-[#127338]',
      icon: 'check',
      message: 'Confirmed for this window. Start preparing so it\u2019s ready before pickup.',
    },
  },
  preparing: {
    showStatusBadge: true,
    statusLabel: 'Preparing',
    statusTone: 'bg-[#E7F0FF] text-[#2978DB]',
    showDeliveryWindow: true,
    showPrepTime: false,
    headerBorder: false,
    banner: {
      tone: 'bg-[#E7F0FF] text-[#2978DB]',
      icon: null,
      message: 'Preparing now. Mark ready when packed so the champ can pick up.',
    },
  },
  readyForPickup: {
    showStatusBadge: true,
    statusLabel: 'Ready for pickup',
    statusTone: 'bg-[#E3F2EB] text-[#127036]',
    showDeliveryWindow: true,
    showPrepTime: false,
    headerBorder: false,
    banner: {
      tone: 'bg-[#E7F6E7] text-[#127338]',
      icon: 'champ',
      message: null,
    },
  },
}

function buildScheduledDetails(order, columnKey) {
  const customerParts = String(order.customer || '').split(' · ')
  const customerName = order.customerName || customerParts[0] || 'Sara A.'
  const customerPhone = order.customerPhone || '+973 3xxx xxxx'
  const itemsList =
    order.itemsList?.length > 0
      ? order.itemsList
      : [
          { qty: 2, name: 'iPhone 15 pro max' },
          { qty: 1, name: 'iPhone case' },
        ]

  const config = columnModalConfig[columnKey] || columnModalConfig.confirmed
  const champName = order.champName || 'Ahmed K.'

  let bannerMessage = config.banner?.message
  if (columnKey === 'readyForPickup') {
    bannerMessage = `Champ ${champName} assigned · arriving for pickup. Hand over when he arrives.`
  }

  return {
    title: `Scheduled order · ${order.id}`,
    deliveryWindow: order.when || 'Today · 8–10 PM',
    customerLine: `${customerName} · ${customerPhone}`,
    deliveryType: order.deliveryType || `${order.window || 'Same Day'} · scheduled`,
    prepTime: order.prepTimeRequired ? `Required: ${order.prepTimeRequired}` : 'Required: 20 mins',
    itemsList,
    windowLabel: order.window || 'Same Day',
    windowTone: windowTones[order.windowTone] || windowTones.blue,
    config: { ...config, banner: config.banner ? { ...config.banner, message: bannerMessage } : null },
  }
}

const itemsLabel = 'text-[11px] font-semibold leading-[13px] tracking-[0.03em] text-[#8C948C] uppercase'

function ItemRow({ qty, name }) {
  return (
    <div className="box-border flex w-full items-center rounded-full bg-[#F5F7F5] px-[12px] py-[9px]">
      <p className="m-0 w-full text-[13px] leading-[16px] text-[#1A1A1A]">
        <span className="font-semibold">{qty}×</span>
        <span className="font-normal"> {name}</span>
      </p>
    </div>
  )
}

function StatusBanner({ banner }) {
  if (!banner) return null

  return (
    <div className={`flex items-center gap-3 rounded-[10px] px-[11px] py-[13px] ${banner.tone}`}>
      {banner.icon === 'check' ? (
        <span>✅</span>
      ) : null}
      {banner.icon === 'champ' ? (
        <img src={motoBike} alt="" className="w-[22px] h-[22px] object-contain shrink-0" aria-hidden="true" />
      ) : null}
      <p className="text-[13px] font-semibold leading-[1.45]">{banner.message}</p>
    </div>
  )
}

export default function ScheduledOrderModal({ open, onClose, order, columnKey = 'confirmed' }) {
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

  const details = buildScheduledDetails(order, columnKey)
  const { config } = details
  const isNew = columnKey === 'new'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[16px] " role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[rgba(0,0,0,0.25)]" aria-label="Close scheduled order details" onClick={onClose} />
      <div className="relative flex w-full max-w-[760px] min-h-[368px] flex-col bg-white rounded-[18px] shadow-[0_12px_40px_rgba(0,0,0,0.18)] overflow-hidden">
        <div
          className={`flex items-center justify-between gap-4 px-8 py-2 border-b border-[#E0E5E0]  `}
        >
          {isNew ? (
            <>
              <h2 className="text-[19px] font-bold text-[#1A1A1A] leading-tight min-w-0">{details.title}</h2>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center rounded-full py-[4px] px-[10px] text-[10.5px] font-semibold ${details.windowTone}`}>
                  {details.windowLabel}
                </span>
                <button
                  type="button"
                  className="w-8 h-8 rounded-[8px] border-0 bg-transparent text-[#949C94] hover:bg-[#f7f9f7] grid place-items-center"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[18px] font-bold text-[#1A1A1A] leading-tight min-w-0">{details.title}</h2>
              <div className="flex items-center gap-2 shrink-0">
                {config.showStatusBadge ? (
                  <span className={`inline-flex items-center rounded-full py-[4px] px-[10px] text-[10.5px] font-bold ${config.statusTone}`}>
                    {config.statusLabel}
                  </span>
                ) : null}
                <span className={`inline-flex items-center rounded-full py-[4px] px-[10px] text-[10.5px] font-semibold ${details.windowTone}`}>
                  {details.windowLabel}
                </span>
                <button
                  type="button"
                  className="w-8 h-8 rounded-[8px] border-0 bg-transparent text-[#949C94] hover:bg-[#f7f9f7] grid place-items-center"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="grid flex-1 grid-cols-[1.05fr_0.95fr] items-start max-[640px]:grid-cols-1 px-8 pt-5 pb-5 gap-8">
          <div className="grid gap-[18px] max-[640px]:pb-2">
            {config.showPrepTime ? (
              <div>
                <p className={fieldLabel}>Prep time</p>
                <p className={`${fieldValue} mt-[6px]`}>{details.prepTime}</p>
              </div>
            ) : null}
            {config.showDeliveryWindow ? (
              <div>
                <p className={fieldLabel}>Delivery window</p>
                <p className={`${fieldValue} mt-[6px]`}>{details.deliveryWindow}</p>
              </div>
            ) : null}
            <div>
              <p className={fieldLabel}>Customer</p>
              <p className={`${fieldValue} mt-[6px]`}>{details.customerLine}</p>
            </div>
            <div>
              <p className={fieldLabel}>Delivery type</p>
              <p className={`${fieldValue} mt-[6px]`}>{details.deliveryType}</p>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-[10px]">
            <p className={itemsLabel}>Items</p>
            <div className="flex w-full flex-col items-start gap-[10px]">
              {details.itemsList.map((item, idx) => (
                <ItemRow key={`${item.name}-${idx}`} qty={item.qty} name={item.name} />
              ))}
            </div>
          </div>
        </div>

        {order.note ? (
          <div className="mx-8 mb-4 flex items-center justify-between rounded-[10px] bg-[#FFF4E5] px-4 py-3 text-[#D9730D]">
            <span className="text-[12px] font-medium">{order.note}</span>
            {order.noteValue ? <strong className="text-[13px] font-bold">{order.noteValue}</strong> : null}
          </div>
        ) : null}

        {config.banner ? (
          <div className="mt-auto px-8 pb-8">
            <StatusBanner banner={config.banner} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
