import { useEffect } from 'react'
import { X } from 'lucide-react'

const fieldLabel = 'text-[13px] font-medium text-[#949C94] uppercase tracking-[0.04em]'
const fieldValue = 'text-[13px] font-medium text-[#1A1A1A]'

const columnModalConfig = {
  new: {
    statusLabel: 'New',
    statusTone: 'bg-[#E3F2EB] text-[#127036]',
    timeLabel: 'Duration',
    useDurationValue: true,
    banner: null,
  },
  upcoming: {
    statusLabel: 'Confirmed',
    statusTone: 'bg-[#E7F0FF] text-[#2978DB]',
    timeLabel: 'Duration',
    useDurationValue: true,
    banner: null,
  },
  inProgress: {
    statusLabel: 'In progress',
    statusTone: 'bg-[#E7F0FF] text-[#2978DB]',
    timeLabel: 'Appointment',
    useDurationValue: false,
    banner: {
      tone: 'bg-[#E7F0FF] text-[#2978DB]',
      message: 'In progress now. Mark completed when the service is done.',
    },
  },
}

function buildDetails(order, columnKey) {
  const config = columnModalConfig[columnKey] || columnModalConfig.new

  let status = { label: config.statusLabel, tone: config.statusTone }
  if (order.noShow) {
    status = { label: 'No-show', tone: 'bg-[#FCE8E8] text-[#C91A24]' }
  } else if (order.slaLabel === 'Accepted-Awaiting payment') {
    status = { label: 'Awaiting payment', tone: 'bg-[#FFF4E5] text-[#D9730D]' }
  }

  const servicesList =
    order.servicesList?.length > 0
      ? order.servicesList
      : order.addOns?.length > 0
        ? [{ qty: 1, name: order.service }, ...order.addOns.map((name) => ({ qty: 1, name }))]
        : [{ qty: 1, name: order.service || 'Haircut & styling' }]

  const timeValue = config.useDurationValue
    ? order.durationLabel || `Duration: ${order.duration || '45 mins'}`
    : order.when || 'Today · 8–10 PM'

  return {
    title: `Service booking · ${order.id}`,
    status,
    config,
    timeValue,
    customerLine: `${order.customer || 'Sara A.'} · ${order.customerPhone || '+973 3xxx xxxx'}`,
    bookingType: order.bookingType || `${order.category || 'Salon & Beauty'} · booking`,
    servicesList,
  }
}

export default function ServiceBookingModal({ open, onClose, order, columnKey }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
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

  const details = buildDetails(order, columnKey)
  const { config } = details

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[rgba(0,0,0,0.25)]" aria-label="Close service booking" onClick={onClose} />

      <div className="relative flex min-h-[341px] w-full max-w-[760px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#E0E5E0] px-8 py-5">
          <h2 className="min-w-0 text-[18px] font-bold leading-tight text-[#1A1A1A]">{details.title}</h2>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-[10px] py-[4px] text-[11px] font-bold ${details.status.tone}`}>
              {details.status.label}
            </span>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-[8px] border-0 bg-transparent text-[#949C94] hover:bg-[#f7f9f7]"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-8 py-6">
          <div className="grid grid-cols-[1.15fr_0.85fr] gap-5 max-[760px]:grid-cols-1">
            <div className="grid gap-[14px]">
              <div>
                <p className={fieldLabel}>{config.timeLabel}</p>
                <p className={`${fieldValue} mt-1`}>{details.timeValue}</p>
              </div>
              <div>
                <p className={fieldLabel}>Customer</p>
                <p className={`${fieldValue} mt-1`}>{details.customerLine}</p>
              </div>
              <div>
                <p className={fieldLabel}>Booking type</p>
                <p className={`${fieldValue} mt-1`}>{details.bookingType}</p>
              </div>
            </div>

            <div>
              <p className={`${fieldLabel} mb-3`}>Services</p>
              <div className="flex flex-col gap-2">
                {details.servicesList.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex min-h-[36px] items-center rounded-full bg-[#F5F7F5] px-[12px] py-[9px] text-[13px] font-medium text-[#1A1A1A]"
                  >
                    <span className="font-bold">{item.qty}×</span>
                    <span className="ml-1.5">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {config.banner ? (
            <div className={`mt-auto rounded-[10px] px-5 py-4 text-[13px] font-medium leading-[1.45] ${config.banner.tone}`}>
              {config.banner.message}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
