import { useState } from 'react'
import { serviceBookings } from '../data/mockData'
import { CalendarDateIcon } from '../components/CalendarDateIcon'
import ServiceBookingModal from '../components/ServiceBookingModal'
import ServiceRejectBookingModal from '../components/ServiceRejectBookingModal'

const columnMeta = {
  new: { title: 'New', items: serviceBookings.new },
  upcoming: { title: 'Upcoming', items: serviceBookings.upcoming },
  inProgress: { title: 'In progress', items: serviceBookings.inProgress },
}

const tagTones = {
  blue: 'bg-[#e5f0ff] text-[#2978db]',
  blueBright: 'bg-[rgba(0,122,255,0.15)] text-[#007aff]',
}

function stopCardAction(event) {
  event.stopPropagation()
}

function BookingCard({ order, columnKey, onSelect, onReject }) {
  if (order.noShow) {
    return (
      <div
        className="flex w-full cursor-pointer flex-col gap-[7px] rounded-[10px] bg-white p-3 opacity-85"
        onClick={() => onSelect?.({ order, columnKey })}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect?.({ order, columnKey })
          }
        }}
        role="button"
        tabIndex={0}
      >
        <p className="text-right text-[11px] font-medium text-ink-muted">{order.when}</p>
        <p className="text-[14px] font-bold text-ink">{order.id}</p>
        <p className="text-[12px] text-ink-muted">
          {order.customer} · {order.service}
        </p>
        <div className="w-full rounded-[8px] bg-danger-soft px-[9px] py-[3px]">
          <p className="text-[11px] font-bold text-[#c91a24]">✕ No-show · cancelled</p>
        </div>
        <p className="text-[11.5px] text-[#6b756e]">{order.noShowReason}</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-[7px] rounded-[10px] bg-white p-3">
      <div
        className="flex cursor-pointer flex-col gap-[7px]"
        onClick={() => onSelect?.({ order, columnKey })}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect?.({ order, columnKey })
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex w-full items-center gap-1.5">
          {order.tag ? (
            <span className={`inline-flex h-5 items-center whitespace-nowrap rounded-full px-[9px] py-[3px] text-[10.5px] font-semibold ${tagTones[order.tagTone]}`}>
              {order.tag}
            </span>
          ) : null}
          <p className="flex-1 text-right text-[11px] font-medium text-ink-muted">{order.when}</p>
        </div>
        <p className="text-[14px] font-bold text-ink">{order.id}</p>
        <p className="text-[12px] text-ink-muted">
          {order.customer} · {order.service}
        </p>

        {order.slaLabel ? (
          <div className="flex w-full items-center justify-between text-[#d9730d]">
            <p className="text-[11px] font-medium">{order.slaLabel}</p>
            <p className="text-[13px] font-bold">{order.slaValue}</p>
          </div>
        ) : null}
      </div>

      {order.actions && order.actions.length === 2 ? (
        <div className="flex w-full gap-2">
          <button type="button" className="flex-1 rounded-[8px] bg-green-primary px-3 py-2 text-xs font-semibold text-white" onClick={stopCardAction}>
            {order.actions[0]}
          </button>
          <button
            type="button"
            className="flex-1 rounded-[8px] border border-border bg-white px-3 py-2 text-xs font-semibold text-danger"
            onClick={(event) => {
              stopCardAction(event)
              onReject?.({ order, columnKey })
            }}
          >
            {order.actions[1]}
          </button>
        </div>
      ) : null}

      {order.buttonLabel ? (
        <button type="button" className="h-8 w-full rounded-[8px] bg-[#2e9e4d] text-[13px] font-semibold text-white" onClick={stopCardAction}>
          {order.buttonLabel}
        </button>
      ) : null}
    </div>
  )
}

export default function Services() {
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [rejectBooking, setRejectBooking] = useState(null)

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <h1 className="mb-4 text-[26px] font-bold text-ink">Services bookings</h1>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-[6px] rounded-[18px] border-[1.2px] border-[#e0e5e0] bg-white py-2 px-[14px] text-[13px] font-semibold text-ink"
        >
          <CalendarDateIcon />
          Calendar view
        </button>
        <input
          className="h-10 min-w-[220px] rounded-[8px] border border-border bg-white px-[14px] text-xs"
          placeholder="Search by order #…"
        />
      </div>

      <div className="grid grid-cols-3 gap-[14px] max-[1200px]:grid-cols-1">
        {Object.entries(columnMeta).map(([key, meta]) => (
          <div key={key} className="flex min-h-[520px] flex-col gap-2.5 rounded-lg bg-[#eef2ee] px-3 py-[14px]">
            <div className="mb-3 flex items-center justify-between text-sm font-bold">
              <span>{meta.title}</span>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white px-[7px] py-[2px] text-[11px] font-semibold text-ink-muted">{meta.items.length}</span>
                <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[6px] border border-[#d9ded9] bg-white text-[11px] font-semibold text-ink-muted">
                  ↗
                </span>
              </div>
            </div>
            {meta.items.length === 0 ? (
              <div className="p-6 text-center text-[13px] text-ink-muted">No bookings</div>
            ) : (
              meta.items.map((order, idx) => (
                <BookingCard
                  key={`${order.id}-${idx}`}
                  order={order}
                  columnKey={key}
                  onSelect={setSelectedBooking}
                  onReject={({ order: rejectTarget }) => setRejectBooking(rejectTarget)}
                />
              ))
            )}
          </div>
        ))}
      </div>

      <ServiceBookingModal
        open={Boolean(selectedBooking?.order)}
        onClose={() => setSelectedBooking(null)}
        order={selectedBooking?.order}
        columnKey={selectedBooking?.columnKey}
      />

      <ServiceRejectBookingModal
        open={Boolean(rejectBooking)}
        onClose={() => setRejectBooking(null)}
        order={rejectBooking}
      />
    </div>
  )
}
