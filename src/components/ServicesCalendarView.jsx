import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useVendorServiceCalendar } from '../hooks/vendor/useVendorServiceCalendar'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const EMPTY_COUNTS = {}
const EMPTY_DAYS = {}

function dateKey(year, month, day) {
  const monthPart = String(month + 1).padStart(2, '0')
  const dayPart = String(day).padStart(2, '0')
  return `${year}-${monthPart}-${dayPart}`
}

function toMonthParam(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

function bookingLabel(count) {
  return count === 1 ? '1 booking' : `${count} bookings`
}

function defaultVisibleMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

export default function ServicesCalendarView({
  leftAction = null,
  initialYear,
  initialMonth,
  initialSelectedDay = null,
  onDaySelect,
}) {
  const defaults = defaultVisibleMonth()
  const [year, setYear] = useState(initialYear ?? defaults.year)
  const [month, setMonth] = useState(initialMonth ?? defaults.month)
  const [selectedDay, setSelectedDay] = useState(initialSelectedDay)

  const monthParam = toMonthParam(year, month)
  const { data: calendar, error, isLoading, refetch } = useVendorServiceCalendar({
    month: monthParam,
  })

  const monthLabel = useMemo(
    () => new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    [year, month],
  )

  const countsByDate = calendar?.countsByDate ?? EMPTY_COUNTS
  const daysByDate = calendar?.daysByDate ?? EMPTY_DAYS

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
        bookingCount: countsByDate[key] ?? 0,
        dayMeta: daysByDate[key] || null,
      })
    }

    while (cells.length % 7 !== 0) {
      cells.push({ type: 'empty', key: `empty-end-${cells.length}` })
    }

    return cells
  }, [year, month, countsByDate, daysByDate])

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
          {error ? (
            <p className="text-[12px] text-danger">
              Calendar failed.{' '}
              <button type="button" onClick={refetch} className="underline">
                Retry
              </button>
            </p>
          ) : null}
          {calendar?.totalBookings != null ? (
            <span className="text-[12px] font-medium text-ink-muted">
              {calendar.totalBookings} total
            </span>
          ) : null}
          <span className="text-[16px] font-bold text-ink">{monthLabel}</span>
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

      {isLoading && !calendar ? (
        <div className="p-6 text-center text-[13px] text-ink-muted">Loading calendar…</div>
      ) : null}

      {error && !calendar ? (
        <div className="p-6 text-center text-[13px] text-danger">
          Unable to load calendar.{' '}
          <button type="button" onClick={refetch} className="underline">
            Try again
          </button>
        </div>
      ) : null}

      {calendar || !isLoading ? (
        <>
          <div className="mb-2 grid grid-cols-7 gap-2">
            {WEEKDAYS.map((label) => (
              <div key={label} className="px-1 text-center text-[12px] font-medium text-[#8a938c]">
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
                      onDaySelect?.({
                        year,
                        month,
                        day: cell.day,
                        count: cell.bookingCount,
                        statuses: cell.dayMeta?.statuses || {},
                        date: cell.key,
                      })
                    }
                  }}
                >
                  <span className="text-[13px] font-medium leading-none text-ink">{cell.day}</span>
                  {hasBookings ? (
                    <span className="mt-2 inline-flex rounded-full bg-[#2e9e4d] px-2.5 py-[3px] text-[11px] font-medium leading-none text-white">
                      {bookingLabel(cell.bookingCount)}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
