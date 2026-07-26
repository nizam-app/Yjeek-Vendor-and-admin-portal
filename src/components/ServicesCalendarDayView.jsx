import { useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft } from 'lucide-react'

const statusTone = 'bg-[#e8f3ea] text-[#2e9e4d]'

function formatDayTitle(year, month, day, count) {
  const date = new Date(year, month, day)
  const weekday = date.toLocaleString('en-US', { weekday: 'short' })
  const monthName = date.toLocaleString('en-US', { month: 'long' })
  const bookingWord = count === 1 ? 'booking' : 'bookings'
  return `${weekday} ${day} ${monthName} · ${count} ${bookingWord}`
}

function formatStatusLabel(statusKey) {
  const raw = String(statusKey || '').trim()
  if (!raw) return 'Unknown'
  return raw
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Day drill-down for services calendar.
 * Confirmed calendar API only returns per-day counts + status tallies
 * (not individual booking rows), so this view renders that summary.
 */
export default function ServicesCalendarDayView({
  year,
  month,
  day,
  count = 0,
  statuses = {},
  onBack,
  onSelect,
}) {
  const [query, setQuery] = useState('')

  const statusRows = useMemo(() => {
    const entries = Object.entries(statuses || {}).map(([status, statusCount]) => ({
      status: formatStatusLabel(status),
      statusKey: status,
      count: Number(statusCount) || 0,
    }))
    return entries.filter((row) => row.count > 0)
  }, [statuses])

  const filteredRows = useMemo(
    () =>
      statusRows.filter((row) =>
        [row.status, String(row.count)].join(' ').toLowerCase().includes(query.toLowerCase()),
      ),
    [statusRows, query],
  )

  const totalCount = count || statusRows.reduce((sum, row) => sum + row.count, 0)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-[18px] border border-[#e0e5e0] bg-white py-1.5 pl-2.5 pr-3.5 text-[12px] font-medium text-ink-muted hover:bg-[#fafbfa]"
          onClick={onBack}
        >
          <ChevronLeft size={14} strokeWidth={2.2} />
          Calendar
        </button>
        <h1 className="text-[20px] font-bold tracking-[-0.02em] text-ink">
          {formatDayTitle(year, month, day, totalCount)}
        </h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          className="min-w-[220px] flex-1 rounded-md border border-border bg-white px-[14px] py-[10px] text-[13px]"
          placeholder="Search statuses..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-white px-[14px] py-[10px] text-[13px] font-medium text-ink"
        >
          Sort: Status
          ▾
        </button>
      </div>

      {filteredRows.length === 0 ? (
        <div className="p-6 text-center text-[13px] text-ink-muted">No bookings</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredRows.map((row) => (
            <button
              key={row.statusKey}
              type="button"
              className="flex w-full items-center gap-5 rounded-[12px] border border-[#e8ece8] bg-white px-5 py-4 text-left transition-colors hover:bg-[#fafbfa]"
              onClick={() => onSelect?.({ status: row, year, month, day })}
            >
              <span className="w-[76px] shrink-0 text-[14px] font-bold leading-none text-ink">
                {row.count}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold leading-snug text-ink">
                  {row.status}
                </span>
                <span className="mt-1 block text-[12px] leading-none text-ink-muted">
                  {row.count === 1 ? '1 booking' : `${row.count} bookings`}
                </span>
              </span>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-medium ${statusTone}`}
              >
                {row.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
