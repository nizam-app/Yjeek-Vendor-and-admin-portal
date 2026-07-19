import { Clock } from 'lucide-react'
import { scheduledOrders } from '../data/mockData'

const windowTones = {
  blue: 'bg-[#e5f0ff] text-[#2978db]',
  purple: 'bg-[#ede3fa] text-[#704dbf]',
  orange: 'bg-[#fff0d9] text-[#d98c1a]',
  gray: 'bg-[#ededed] text-ink-muted',
}

const btnBase = 'w-full text-center rounded-[8px] py-2 text-[13px] font-medium'
const btnPrimaryFull = `bg-green-primary text-white ${btnBase} hover:brightness-[0.96]`
const btnPrimaryAction = 'flex-1 text-center bg-green-primary text-white rounded-[8px] px-3 py-[10px] text-[13px] font-medium hover:brightness-[0.96]'
const btnDangerOutline = 'flex-1 text-center border border-[#e8b4b8] text-danger bg-white rounded-[8px] px-3 py-[10px] text-[13px] font-medium'
const btnPrimaryActionCompact = 'flex-1 text-center bg-green-primary text-white rounded-[8px] px-3 py-2 text-xs font-medium hover:brightness-[0.96]'
const btnDangerOutlineCompact = 'flex-1 text-center border border-border text-danger bg-white rounded-[8px] px-3 py-2 text-xs font-medium'

export const columnMeta = {
  new: {
    title: 'New',
    subtitle: 'New — confirm you can fulfil before the window',
    buttonLabel: null,
  },
  confirmed: {
    title: 'Confirmed',
    subtitle: 'Confirmed — start preparing manually before pickup',
    buttonLabel: 'Start preparing',
  },
  preparing: {
    title: 'Preparing',
    subtitle: 'Orders being prepared for the scheduled window.',
    buttonLabel: 'Mark ready for pickup',
  },
  readyForPickup: {
    title: 'Ready for pickup',
    subtitle: 'Ready orders — hand over to champ before the window closes.',
    buttonLabel: 'Handover to champ',
  },
}

function stopCardAction(e) {
  e.stopPropagation()
}

function getItemsSummary(order) {
  if (order.itemsList?.length) {
    const count = order.itemsList.reduce((sum, item) => sum + (item.qty || 1), 0)
    return `${count} items`
  }

  const match = order.customer?.match(/(\d+ items)/)
  return match ? match[1] : order.customer
}

function getScheduleLine(order) {
  if (order.arriveBy) return `${order.when} · arrive by ${order.arriveBy}`
  return order.when
}

function getCustomerLine(order) {
  if (order.customerName && order.customerPhone) {
    return `${order.customerName} · ${order.customerPhone}`
  }
  return order.customer
}

export function ScheduleCard({ order, columnKey, dense, onSelect, onAction, onReject }) {
  const meta = columnMeta[columnKey]
  const isNew = columnKey === 'new'

  if (dense) {
    return (
      <div className="bg-white rounded-[10px] flex flex-col w-full p-4 gap-4 border border-border">
        <div
          className="flex flex-col gap-2 cursor-pointer"
          onClick={() => onSelect?.({ order, columnKey })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect?.({ order, columnKey })
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[16px] font-bold text-ink">{order.id}</p>
            <span className={`inline-flex items-center rounded-full py-[3px] px-[9px] text-[11px] font-medium shrink-0 ${windowTones[order.windowTone]}`}>
              {order.window}
            </span>
          </div>

          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
            <Clock size={13} strokeWidth={2} className="text-ink-muted shrink-0" aria-hidden="true" />
            {getScheduleLine(order)}
          </p>

          <p className="text-[12.5px] text-ink-muted">{getCustomerLine(order)}</p>
          <p className="text-[12.5px] text-ink-muted">{getItemsSummary(order)}</p>

          {order.sla ? (
            <p className="flex items-center justify-between text-warn pt-0.5">
              <span className="text-[11px] font-medium">Accept within (SLA 5 min)</span>
              <strong className="text-[13px] font-bold">{order.sla}</strong>
            </p>
          ) : null}
          {order.note ? (
            <p className="flex items-center justify-between text-warn pt-0.5">
              <span className="text-[11px] font-medium">{order.note}</span>
              <strong className="text-[13px] font-bold">{order.noteValue}</strong>
            </p>
          ) : null}
        </div>

        {isNew && order.sla ? (
          <div className="flex gap-2.5">
            <button
              type="button"
              className={btnPrimaryAction}
              onClick={(e) => {
                stopCardAction(e)
                onAction?.({ order, columnKey })
              }}
            >
              Confirm
            </button>
            <button
              type="button"
              className={btnDangerOutline}
              onClick={(e) => {
                stopCardAction(e)
                onReject?.({ order, columnKey })
              }}
            >
              Decline
            </button>
          </div>
        ) : null}
        {!isNew && meta.buttonLabel ? (
          <button
            type="button"
            className={btnPrimaryFull}
            onClick={(e) => {
              stopCardAction(e)
              onAction?.({ order, columnKey })
            }}
          >
            {meta.buttonLabel}
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[10px] flex flex-col w-full p-3 gap-[7px]">
      <div
        className="flex flex-col gap-[7px] cursor-pointer"
        onClick={() => onSelect?.({ order, columnKey })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect?.({ order, columnKey })
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center rounded-full py-[3px] px-[9px] text-[11px] font-medium ${windowTones[order.windowTone]}`}>
            {order.window}
          </span>
          <span className="flex-1 text-right text-[11px] font-medium text-ink-muted">{order.when}</span>
        </div>

        <p className="text-[14px] font-bold text-ink">{order.id}</p>
        <p className="text-xs text-ink-muted">{order.customer}</p>

        {order.sla ? (
          <p className="flex items-center justify-between text-warn">
            <span className="text-[11px] font-medium">Accept within (SLA 5min)</span>
            <strong className="text-[13px] font-bold">{order.sla}</strong>
          </p>
        ) : null}
        {order.note ? (
          <p className="flex items-center justify-between text-warn">
            <span className="text-[11px] font-medium">{order.note}</span>
            <strong className="text-[13px] font-bold">{order.noteValue}</strong>
          </p>
        ) : null}
      </div>

      {isNew && order.sla ? (
        <div className="flex gap-2">
          <button
            type="button"
            className={btnPrimaryActionCompact}
            onClick={(e) => {
              stopCardAction(e)
              onAction?.({ order, columnKey })
            }}
          >
            Accept
          </button>
          <button
            type="button"
            className={btnDangerOutlineCompact}
            onClick={(e) => {
              stopCardAction(e)
              onReject?.({ order, columnKey })
            }}
          >
            Reject
          </button>
        </div>
      ) : null}
      {!isNew && meta.buttonLabel ? (
        <button
          type="button"
          className={btnPrimaryFull}
          onClick={(e) => {
            stopCardAction(e)
            onAction?.({ order, columnKey })
          }}
        >
          {meta.buttonLabel}
        </button>
      ) : null}
    </div>
  )
}

export function getScheduledColumns() {
  return Object.entries(columnMeta).map(([key, meta]) => ({
    key,
    title: meta.title,
    subtitle: meta.subtitle,
    buttonLabel: meta.buttonLabel,
    items: scheduledOrders[key] || [],
  }))
}
