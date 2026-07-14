import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { serviceCalendarBookings } from '../data/mockData'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dateKey(year, month, day) {
  const monthPart = String(month + 1).padStart(2, '0')
  const dayPart = String(day).padStart(2, '0')
  return `${year}-${monthPart}-${dayPart}`
}

function bookingLabel(count) {
  return count === 1 ? '1 booking' : `${count} bookings`
}

export default function ServicesCalendarView({
  leftAction = null,
  initialYear = serviceCalendarBookings.defaultYear,
  initialMonth = serviceCalendarBookings.defaultMonth,
  initialSelectedDay = serviceCalendarBookings.defaultSelectedDay,
  onDaySelect,
}) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [selectedDay, setSelectedDay] = useState(initialSelectedDay)

  const monthLabel = useMemo(
    () => new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    [year, month],
  )

  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstWeekday = new Date(year, month, 1).getDay()
    const cells = []

    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push({ type: 'empty', key: `empty-start-${i}` })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = dateKey(year, month, day)
      cells.push({
        type: 'day',
        key,
        day,
        bookingCount: serviceCalendarBookings.counts[key] ?? 0,
      })
    }

    while (cells.length % 7 !== 0) {
      cells.push({ type: 'empty', key: `empty-end-${cells.length}` })
    }

    return cells
  }, [year, month])

  function shiftMonth(delta) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
    setSelectedDay(null)
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>{leftAction}</div>
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-bold text-ink">{monthLabel}</span>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#d9ded9] bg-white text-ink-muted hover:bg-[#f5f7f5]"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft size={14} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#d9ded9] bg-white text-ink-muted hover:bg-[#f5f7f5]"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight size={14} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-2">
        {WEEKDAYS.map((label) => (
          <div key={label} className="px-1 text-center text-[12px] font-semibold text-[#8a938c]">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarCells.map((cell) => {
          if (cell.type === 'empty') {
            return (
              <div
                key={cell.key}
                className="h-[108px] rounded-[8px] border border-[#e0e5e0] bg-white"
                aria-hidden="true"
              />
            )
          }

          const isSelected = selectedDay === cell.day
          const hasBookings = cell.bookingCount > 0

          return (
            <button
              key={cell.key}
              type="button"
              className={`flex h-[108px] flex-col items-start rounded-[8px] border p-3 text-left transition-colors ${
                isSelected
                  ? 'border-[#2e9e4d] bg-[#e8f3ea]'
                  : 'border-[#e0e5e0] bg-white hover:border-[#c8cfc8]'
              }`}
              onClick={() => {
                setSelectedDay(cell.day)
                if (hasBookings) {
                  onDaySelect?.({ year, month, day: cell.day })
                }
              }}
            >
              <span className="text-[13px] font-semibold leading-none text-ink">{cell.day}</span>
              {hasBookings ? (
                <span className="mt-2 inline-flex rounded-full bg-[#2e9e4d] px-2.5 py-[3px] text-[11px] font-semibold leading-none text-white">
                  {bookingLabel(cell.bookingCount)}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
