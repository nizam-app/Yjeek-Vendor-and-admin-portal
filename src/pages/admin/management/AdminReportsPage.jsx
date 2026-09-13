import { useEffect, useMemo, useState } from 'react'
import { Calendar, Download, Search, Star } from 'lucide-react'
import { cn } from '../../../components/admin/cn'
import { ApiState } from '../../../components/admin/ApiState'
import { AdminFilterSelect } from '../../../components/admin/AdminFilterSelect'
import { adminReportService } from '../../../services/admin/reportService'
import {
  mapReportsChampFilterToApi,
  mapReportsPaymentFilterToApi,
  mapReportsPeriodToPreset,
  mapReportsSlaFilterToApi,
  mapReportsSortToApi,
  mapReportsStatusFilterToApi,
  mapReportsTypeFilterToApi,
  mapReportsVendorFilterToApi,
  mapReportsZoneFilterToApi,
} from '../../../mappers/admin/mapAdminOrdersReport'

const PAGE_SIZE_OPTIONS = [10, 50, 100]

const COLUMNS = [
  'Order',
  'Date',
  'Time',
  'Mode',
  'Tier',
  'Customer',
  'Store',
  'Branch',
  'City',
  'Block',
  'Champ',
  'Vehicle',
  'Pickup km',
  'Drop-off km',
  'Total km',
  'Items',
  'Value',
  'Pay method',
  'Pay status',
  'Placed',
  'Accepted',
  'Prep',
  'Ready',
  'Picked',
  'On-way',
  'Delivered',
  'SLA',
  'Rating',
  'Status',
]

/** Filter controls — option values are UI labels; mapped to API enums on request. */
const FILTERS = [
  {
    key: 'status',
    label: 'Status',
    options: [
      'Status: All',
      'Status: Delivered',
      'Status: Cancelled',
      'Status: Confirmed',
      'Status: Preparing',
      'Status: Refunded',
    ],
  },
  {
    key: 'type',
    label: 'Type',
    options: [
      'Type: All',
      'Type: Instant',
      'Type: Pickup',
      'Type: Dine-in',
      'Type: Hot food',
      'Type: Grocery',
      'Type: Services',
    ],
  },
  {
    key: 'vendor',
    label: 'Vendor',
    options: ['Vendor: All'],
  },
  {
    key: 'zone',
    label: 'Zone',
    options: ['Zone: All', 'Zone: Manama', 'Zone: Muharraq', 'Zone: Riffa'],
  },
  {
    key: 'champ',
    label: 'Champ',
    options: ['Champ: All'],
  },
  {
    key: 'payment',
    label: 'Payment',
    options: ['Payment: All', 'Payment: Wallet', 'Payment: Card', 'Payment: COD'],
  },
  {
    key: 'sla',
    label: 'SLA',
    options: ['SLA: All', 'SLA: On-time', 'SLA: Late'],
  },
]

const PERIOD_OPTIONS = [
  'Period: Last 7 days',
  'Period: Last 30 days',
  'Period: Last 90 days',
  'Period: This year',
]

const SORT_OPTIONS = [
  'Sort: Newest',
  'Sort: Oldest',
  'Sort: Highest value',
  'Sort: Lowest value',
]

const statTone = {
  ink: 'text-[#17231c]',
  green: 'text-[#1aa054]',
  red: 'text-[#d6453d]',
  orange: 'text-[#c4841a]',
}

const reportBadgeTone = {
  green: 'bg-[#e6f4ea] text-[#137333]',
  purple: 'bg-[#f3e8ff] text-[#6b21a8]',
  yellow: 'bg-[#fef3c7] text-[#92400e]',
  red: 'bg-[#fee2e2] text-[#b91c1c]',
  gray: 'bg-[#eff2f0] text-[#8a948e]',
}

function payStatusTone(value) {
  if (value === 'Paid') return 'green'
  if (value === 'Pending') return 'yellow'
  if (value === 'Refunded') return 'purple'
  return 'gray'
}

function orderStatusTone(value) {
  if (value === 'Delivered') return 'green'
  if (value === 'Cancelled') return 'red'
  if (value === 'Refunded') return 'purple'
  if (value === 'Confirmed' || value === 'Preparing') return 'yellow'
  return 'gray'
}

function slaBadgeTone(value) {
  if (value === 'On-time') return 'green'
  if (value === 'Late') return 'yellow'
  return 'gray'
}

function ReportBadge({ children, tone = 'gray' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-[3px] text-[11px] font-semibold',
        reportBadgeTone[tone] || reportBadgeTone.gray,
      )}
    >
      {children}
    </span>
  )
}

function TimeCell({ value }) {
  return (
    <td className="whitespace-nowrap px-3 py-2.5">
      {value === '—' ? (
        <span className="text-[#9aa39c]">—</span>
      ) : (
        <span className="font-bold text-[#137333]">{value}</span>
      )}
    </td>
  )
}

function StatusBadge({ value, toneFn }) {
  if (!value || value === '—') {
    return <ReportBadge tone="gray">—</ReportBadge>
  }
  return <ReportBadge tone={toneFn(value)}>{value}</ReportBadge>
}

function FilterSelect({ options, value, onChange, label }) {
  return (
    <AdminFilterSelect
      label={label}
      options={options}
      value={value}
      onChange={onChange}
    />
  )
}

function DateFilter({ label, value, onChange }) {
  const display = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      })
    : '—'

  return (
    <label className="relative inline-flex h-[34px] shrink-0 items-center gap-2 rounded-full border border-[#e4e8e4] bg-white pl-3 pr-3 text-[12px] font-medium text-[#455249]">
      <span className="whitespace-nowrap text-[#7c8780]">{label}</span>
      <span className="whitespace-nowrap">{display}</span>
      <Calendar size={13} strokeWidth={2.2} className="text-[#7c8780]" aria-hidden />
      <input
        type="date"
        aria-label={label}
        value={value || ''}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 outline-none"
        onChange={(event) => onChange(event.target.value || '')}
      />
    </label>
  )
}

function pageNumbers(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, '…', total]
  if (current >= total - 2) return [1, '…', total - 2, total - 1, total]
  return [1, '…', current, '…', total]
}

function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function toIsoStart(dateYmd) {
  if (!dateYmd) return ''
  const date = new Date(`${dateYmd}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

function toIsoEnd(dateYmd) {
  if (!dateYmd) return ''
  const date = new Date(`${dateYmd}T23:59:59.999Z`)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState('Last 7 days')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filters, setFilters] = useState(
    Object.fromEntries(FILTERS.map((item) => [item.key, item.options[0]])),
  )
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sort, setSort] = useState('Sort: Newest')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [query])

  const requestFilters = useMemo(
    () => ({
      preset: mapReportsPeriodToPreset(period),
      page,
      limit: pageSize,
      sort: mapReportsSortToApi(sort),
      search: debouncedQuery,
      status: mapReportsStatusFilterToApi(filters.status),
      sla: mapReportsSlaFilterToApi(filters.sla),
      mode: mapReportsTypeFilterToApi(filters.type),
      vendor: mapReportsVendorFilterToApi(filters.vendor),
      city: mapReportsZoneFilterToApi(filters.zone),
      champ: mapReportsChampFilterToApi(filters.champ),
      payMethod: mapReportsPaymentFilterToApi(filters.payment),
      from: toIsoStart(fromDate),
      to: toIsoEnd(toDate),
    }),
    [period, page, pageSize, sort, debouncedQuery, filters, fromDate, toDate],
  )

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    setIsLoading(true)
    setError(null)

    adminReportService
      .getOrdersReport(requestFilters, { signal: controller.signal })
      .then((response) => {
        if (cancelled) return
        setData(response?.data || null)
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return
        setError(err)
        setData(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [requestFilters, reloadToken])

  const filterOptions = useMemo(() => {
    const vendorNames = new Set()
    const champNames = new Set()
    ;(data?.rows || []).forEach((row) => {
      if (row.store && row.store !== '—') vendorNames.add(row.store)
      if (row.champ && row.champ !== '—') champNames.add(row.champ)
    })

    return FILTERS.map((filter) => {
      if (filter.key === 'vendor') {
        const extras = [...vendorNames].sort().map((name) => `Vendor: ${name}`)
        return { ...filter, options: ['Vendor: All', ...extras] }
      }
      if (filter.key === 'champ') {
        const extras = [...champNames].sort().map((name) => `Champ: ${name}`)
        return { ...filter, options: ['Champ: All', ...extras] }
      }
      return filter
    })
  }, [data])

  const totalOrders = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize) || 1)
  const shownFrom = totalOrders === 0 ? 0 : (page - 1) * pageSize + 1
  const shownTo = Math.min(page * pageSize, totalOrders)
  const rows = data?.rows || []
  const stats = data?.stats || []

  async function handleExport() {
    if (exporting) return
    setExportError(null)
    setExporting(true)
    try {
      const response = await adminReportService.exportOrdersReport({
        ...requestFilters,
        limit: Math.max(pageSize, 100),
      })
      const csv = response?.data || ''
      if (!csv.trim()) {
        setExportError('Export returned no CSV data.')
        return
      }
      downloadCsv(`orders-report-${requestFilters.preset || 'export'}.csv`, csv)
    } catch (err) {
      setExportError(err?.message || 'Failed to export orders report.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Orders report</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Period"
            value={`Period: ${period}`}
            options={PERIOD_OPTIONS}
            onChange={(value) => {
              setPeriod(value.replace(/^Period\s*[·:]\s*/, ''))
              setPage(1)
            }}
          />
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47] disabled:opacity-60"
          >
            <Download size={14} strokeWidth={2.2} />
            {exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>

      {exportError ? (
        <p className="mb-3 text-[12px] font-medium text-[#d6453d]">{exportError}</p>
      ) : null}

      {isLoading && !stats.length ? (
        <p className="mb-4 text-[12px] text-[#7c8780]">Loading KPIs…</p>
      ) : null}

      {stats.length ? (
        <div className="mb-4 grid grid-cols-8 gap-2.5 max-[1400px]:grid-cols-4 max-[800px]:grid-cols-2 max-[480px]:grid-cols-1">
          {stats.map((stat) => (
            <div
              key={stat.key || stat.label}
              className="rounded-[14px] border border-[#eceeec] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
            >
              <p className={cn('text-[20px] font-bold tracking-[-0.02em]', statTone[stat.tone] || statTone.ink)}>
                {stat.value}
              </p>
              <p className="mt-1 text-[11.5px] text-[#7c8780]">{stat.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-3 rounded-[14px] border border-[#eceeec] bg-white p-3 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex h-[34px] min-w-[220px] flex-1 items-center gap-2 rounded-full border border-[#e4e8e4] bg-white px-3 text-[12px] text-[#455249] max-[700px]:min-w-full">
            <Search size={14} className="shrink-0 text-[#7c8780]" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              className="min-w-0 flex-1 border-0 bg-transparent outline-none placeholder:text-[#9aa39c]"
              placeholder="Search order, customer, vendor, champ…"
            />
          </label>

          {filterOptions.map((filter) => (
            <FilterSelect
              key={filter.key}
              label={filter.label}
              options={filter.options}
              value={filters[filter.key]}
              onChange={(value) => {
                setFilters((prev) => ({ ...prev, [filter.key]: value }))
                setPage(1)
              }}
            />
          ))}

          <DateFilter
            label="From"
            value={fromDate}
            onChange={(value) => {
              setFromDate(value)
              setPage(1)
            }}
          />
          <DateFilter
            label="To"
            value={toDate}
            onChange={(value) => {
              setToDate(value)
              setPage(1)
            }}
          />
        </div>

        <div className="mt-2">
          <FilterSelect
            label="Sort"
            value={sort}
            options={SORT_OPTIONS}
            onChange={(value) => {
              setSort(value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {error && !data ? (
        <ApiState isLoading={false} error={error} onRetry={() => setReloadToken((n) => n + 1)} />
      ) : (
        <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[2200px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                  {COLUMNS.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.05em] text-[#8a948e]"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && !rows.length ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-[12px] text-[#7c8780]">
                      Loading orders…
                    </td>
                  </tr>
                ) : null}
                {!isLoading && !rows.length ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-[12px] text-[#7c8780]">
                      No orders for these filters.
                    </td>
                  </tr>
                ) : null}
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className="cursor-pointer border-b border-[#edf0ee] text-[12px] text-[#455249] hover:bg-[#f8faf8]"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 font-semibold ">{row.id}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{row.date}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{row.time}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{row.mode}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{row.tier}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{row.customer}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{row.store}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{row.branch}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{row.city}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{row.block}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{row.champ}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{row.vehicle}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {row.pickupKm === '—' ? '—' : `${row.pickupKm} km`}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {row.dropoffKm === '—' ? '—' : `${row.dropoffKm} km`}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {row.totalKm === '—' ? '—' : `${row.totalKm} km`}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">{row.items}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-[#17231c]">{row.value}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{row.payMethod}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <StatusBadge value={row.payStatus} toneFn={payStatusTone} />
                    </td>
                    <TimeCell value={row.placed} />
                    <TimeCell value={row.accepted} />
                    <TimeCell value={row.prep} />
                    <TimeCell value={row.ready} />
                    <TimeCell value={row.picked} />
                    <TimeCell value={row.onWay} />
                    <TimeCell value={row.delivered} />
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <StatusBadge value={row.sla} toneFn={slaBadgeTone} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {row.rating === '—' ? (
                        <span className="text-[#9aa39c]">—</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-[#17231c]">
                          <Star size={11} className="fill-[#17231c] text-[#17231c]" />
                          {row.rating}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <StatusBadge value={row.status} toneFn={orderStatusTone} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0ee] px-4 py-3">
            <p className="text-[11.5px] text-[#8a948e]">
              ← Scroll horizontally to see all columns · click a row for full order details →
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="inline-flex h-[30px] items-center rounded-[8px] border border-[#e4e8e4] bg-white px-2.5 text-[12px] font-semibold text-[#455249] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#f8faf8]"
              >
                ‹ Prev
              </button>
              {pageNumbers(page, totalPages).map((item, index) =>
                item === '…' ? (
                  <span key={`ellipsis-${index}`} className="px-1 text-[12px] text-[#8a948e]">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setPage(item)}
                    className={cn(
                      'inline-flex h-[30px] min-w-[30px] items-center justify-center rounded-[8px] text-[12px] font-semibold transition',
                      page === item
                        ? 'bg-[#1aa054] text-white'
                        : 'border border-[#e4e8e4] bg-white text-[#455249] hover:bg-[#f8faf8]',
                    )}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="inline-flex h-[30px] items-center rounded-[8px] border border-[#e4e8e4] bg-white px-2.5 text-[12px] font-semibold text-[#455249] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#f8faf8]"
              >
                Next ›
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[#7c8780]">
        <span>Rows per page:</span>
        {PAGE_SIZE_OPTIONS.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => {
              setPageSize(size)
              setPage(1)
            }}
            className={cn(
              'inline-flex h-[28px] min-w-[34px] items-center justify-center rounded-[8px] border px-2.5 text-[12px] font-bold transition',
              pageSize === size
                ? 'border-[#1aa054] bg-white text-[#1aa054]'
                : 'border-[#e4e8e4] bg-white text-[#69756d] hover:text-[#455249]',
            )}
          >
            {size}
          </button>
        ))}
        <span className="ml-1">
          Showing {shownFrom}–{shownTo} of {totalOrders.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
