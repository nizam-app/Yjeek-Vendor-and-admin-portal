import {
  AdminDatePicker,
  todayLocalIsoDate,
} from '../AdminDatePicker'
import { cn } from '../cn'

function daysAgoLocalIso(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function monthStartLocalIso() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

export function defaultEarningsFromDate() {
  return daysAgoLocalIso(30)
}

export function defaultEarningsToDate() {
  return todayLocalIsoDate()
}

const PRESETS = [
  { id: '30d', label: 'Last 30 days', from: () => daysAgoLocalIso(30), to: () => todayLocalIsoDate() },
  { id: 'mtd', label: 'This month', from: () => monthStartLocalIso(), to: () => todayLocalIsoDate() },
  { id: '7d', label: 'Last 7 days', from: () => daysAgoLocalIso(7), to: () => todayLocalIsoDate() },
]

export function AdminChampEarnings({ earnings, fromDate, toDate, onFromDateChange, onToDateChange }) {
  if (!earnings) return null

  const rows = Array.isArray(earnings.rows) ? earnings.rows : []
  const summary = Array.isArray(earnings.summary) ? earnings.summary : []
  const period = earnings.period || null

  return (
    <div className="space-y-4">
      {(onFromDateChange || onToDateChange) ? (
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="min-w-[150px]">
            <p className="mb-1 text-[11px] font-medium text-[#7c8780]">From</p>
            <AdminDatePicker
              value={fromDate || ''}
              onChange={(value) => onFromDateChange?.(value || '')}
              min={null}
              max={toDate || todayLocalIsoDate()}
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div className="min-w-[150px]">
            <p className="mb-1 text-[11px] font-medium text-[#7c8780]">To</p>
            <AdminDatePicker
              value={toDate || ''}
              onChange={(value) => onToDateChange?.(value || '')}
              min={fromDate || null}
              max={todayLocalIsoDate()}
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
            {PRESETS.map((preset) => {
              const active = fromDate === preset.from() && toDate === preset.to()
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onFromDateChange?.(preset.from())
                    onToDateChange?.(preset.to())
                  }}
                  className={cn(
                    'inline-flex h-[34px] items-center rounded-full border px-3 text-[12px] font-semibold transition',
                    active
                      ? 'border-[#17231c] bg-[#17231c] text-white'
                      : 'border-[#e4e8e4] bg-white text-[#455249] hover:border-[#c9d0cb]',
                  )}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
          <p className="pb-2 text-[12px] text-[#7c8780]">Filter tips &amp; earnings by date range</p>
        </div>
      ) : null}

      {period ? (
        <div className="rounded-[14px] border border-[#d7ebe0] bg-[#f4fbf7] px-4 py-3.5">
          <p className="text-[12px] text-[#5f7a6a]">Selected period</p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
              Tips {period.tips}
            </p>
            <p className="text-[13px] text-[#455249]">
              Earnings {period.earnings} · {period.deliveries} deliveries
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3 max-[800px]:grid-cols-1">
        {summary.map(({ label, value, tips }) => (
          <div
            key={label}
            className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
          >
            <p className="text-[12px] text-[#7c8780]">{label}</p>
            <p className="mt-1.5 text-[22px] font-bold leading-none tracking-[-0.02em] text-[#17231c]">
              {value}
            </p>
            {tips ? (
              <p className="mt-2 text-[12px] text-[#7c8780]">
                Tips: <span className="font-semibold text-[#17231c]">{tips}</span>
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
        <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Earnings breakdown</h3>

        <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                  {['Date', 'Deliveries', 'Earnings', 'Tips', 'Incentive'].map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-[13px] text-[#7c8780]"
                    >
                      No earnings in this period.
                    </td>
                  </tr>
                ) : null}
                {rows.map((row) => (
                  <tr key={row.key || row.date} className="border-b border-[#edf0ee] last:border-0 bg-white">
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] font-medium text-[#17231c]">
                      {row.date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-[#455249]">
                      {row.deliveries}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] font-medium text-[#17231c]">
                      {row.earnings}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-[#455249]">
                      {row.tips}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-[#455249]">
                      {row.incentive}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
