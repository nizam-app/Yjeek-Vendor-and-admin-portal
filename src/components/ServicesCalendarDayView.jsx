import { useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { serviceCalendarDayBookings } from '../data/mockData'

const statusTone = 'bg-[#e8f3ea] text-[#2e9e4d]'

function dateKey(year, month, day) {
  const monthPart = String(month + 1).padStart(2, '0')
  const dayPart = String(day).padStart(2, '0')
  return `${year}-${monthPart}-${dayPart}`
}

function formatDayTitle(year, month, day, count) {
  const date = new Date(year, month, day)
  const weekday = date.toLocaleString('en-US', { weekday: 'short' })
  const monthName = date.toLocaleString('en-US', { month: 'long' })
  const bookingWord = count === 1 ? 'booking' : 'bookings'
  return `${weekday} ${day} ${monthName} · ${count} ${bookingWord}`
}

export default function ServicesCalendarDayView({ year, month, day, onBack, onSelect }) {
  const [query, setQuery] = useState('')
  const key = dateKey(year, month, day)

  const bookings = useMemo(() => serviceCalendarDayBookings[key] ?? [], [key])

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        [booking.customer, booking.service, booking.staff, booking.status, booking.time]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [bookings, query],
  )

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-[18px] border border-[#e0e5e0] bg-white py-1.5 pl-2.5 pr-3.5 text-[12px] font-semibold text-ink-muted hover:bg-[#fafbfa]"
          onClick={onBack}
        >
          <ChevronLeft size={14} strokeWidth={2.2} />
          Calendar
        </button>
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-ink">
          {formatDayTitle(year, month, day, bookings.length)}
        </h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          className="min-w-[220px] flex-1 rounded-md border border-border bg-white px-[14px] py-[10px] text-[13px]"
          placeholder="Search orders, customers, items..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-white px-[14px] py-[10px] text-[13px] font-semibold text-ink"
        >
          Sort: Window
          <ChevronDown size={14} strokeWidth={2.2} className="text-ink-muted" />
        </button>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="p-6 text-center text-[13px] text-ink-muted">No bookings</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredBookings.map((booking, idx) => (
            <button
              key={`${booking.time}-${booking.customer}-${idx}`}
              type="button"
              className="flex w-full items-center gap-5 rounded-[12px] border border-[#e8ece8] bg-white px-5 py-4 text-left transition-colors hover:bg-[#fafbfa]"
              onClick={() => onSelect?.({ booking, year, month, day })}
            >
              <span className="w-[76px] shrink-0 text-[14px] font-bold leading-none text-ink">{booking.time}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold leading-snug text-ink">
                  {booking.customer} · {booking.service}
                </span>
                <span className="mt-1 block text-[12px] leading-none text-ink-muted">with {booking.staff}</span>
              </span>
              <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-semibold ${statusTone}`}>
                {booking.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
