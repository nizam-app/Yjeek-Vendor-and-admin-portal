import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Copy, MoreVertical, Plus, Search } from 'lucide-react'
import { isAdminRealApiFeature } from '../../../api/config'
import { useApiResource } from '../../../hooks/useApiResource'
import { adminVendorService } from '../../../services/admin/vendorService'
import { matchesVendorTab } from '../../../mappers/admin/mapAdminVendors'
import { ApiErrorBanner, StatCardsSkeleton, TableBodySkeleton } from '../../../components/admin/ApiState'
import { showFlashMessage } from '../../../utils/toast'
import { Badge } from '../../../components/admin/Badge'
import { AdminFilterSelect } from '../../../components/admin/AdminFilterSelect'
import { cn } from '../../../components/admin/cn'

const PAGE_SIZE = 20
const VENDOR_TABS = ['All', 'Active', 'Pending', 'Drafts', 'Suspended']
const VENDOR_COLUMNS = ['Vendor', 'Category', 'Orders', 'GMV', 'Commission', 'Status']

function pageNumbers(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, '…', total]
  if (current >= total - 2) return [1, '…', total - 2, total - 1, total]
  return [1, '…', current, '…', total]
}

function filterVendorRows(rows, { tab, category, query }) {
  return rows.filter((row) => {
    const matchesCategory = !category || row.category === category
    const haystack =
      `${row.name} ${row.displayCode || ''} ${row.id} ${row.category} ${row.status}`.toLowerCase()
    const matchesQuery = !query || haystack.includes(query.toLowerCase())
    return matchesVendorTab(row, tab) && matchesCategory && matchesQuery
  })
}

export default function AdminVendorsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const useRealApi = isAdminRealApiFeature('vendors')
  const [tab, setTab] = useState('All')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (location.state?.flash) {
      showFlashMessage(String(location.state.flash))
      navigate(location.pathname, { replace: true, state: { ...location.state, flash: undefined } })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setPage(1)
  }, [tab, debouncedQuery, category])

  const { data, error, isLoading, refetch } = useApiResource(
    () =>
      adminVendorService.listVendors({
        search: debouncedQuery,
        status: tab,
        category,
        limit: PAGE_SIZE,
        page,
        sort: 'newest',
      }),
    [tab, debouncedQuery, category, page],
  )

  const rows = useMemo(() => {
    if (!data?.rows) return []

    if (useRealApi) {
      // Exact category match (defense-in-depth; list API must also use equals, not contains).
      let next = category ? data.rows.filter((row) => row.category === category) : data.rows
      if (tab !== 'All') next = next.filter((row) => matchesVendorTab(row, tab))
      return next
    }

    const filtered = filterVendorRows(data.rows, { tab, category, query: debouncedQuery })
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [data, useRealApi, tab, debouncedQuery, category, page])

  const total = useMemo(() => {
    if (!data?.rows) return 0

    if (useRealApi && data.total != null) {
      const serverTotal = Number(data.total) || 0
      if (tab !== 'All') {
        const tabFiltered = data.rows.filter((row) => matchesVendorTab(row, tab))
        // Server ignored status — full unfiltered page; use client-side tab count.
        if (tabFiltered.length < data.rows.length && data.rows.length >= serverTotal) {
          return tabFiltered.length
        }
      }
      return serverTotal
    }

    return filterVendorRows(data.rows, { tab, category, query: debouncedQuery }).length
  }, [data, useRealApi, tab, debouncedQuery, category])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1)
  const shownFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const shownTo = Math.min(page * PAGE_SIZE, total)

  const categories = useMemo(() => {
    const set = new Set()
    ;(data?.rows || []).forEach((row) => {
      if (row.category && row.category !== '—') set.add(row.category)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [data])

  const title = data?.title || 'Vendors'
  const action = data?.action || 'Add vendor'
  const tabs = data?.tabs?.length ? data.tabs : VENDOR_TABS
  const columns = data?.columns?.length ? data.columns : VENDOR_COLUMNS
  const stats = data?.stats?.length ? data.stats : null
  const showTableSkeleton = isLoading && rows.length === 0 && !error

  const openVendor = (vendorId) => {
    navigate(`/admin/vendors/${encodeURIComponent(vendorId)}`)
  }

  const statTone = {
    ink: 'text-[#17231c]',
    green: 'text-[#1aa054]',
    orange: 'text-[#c4841a]',
    red: 'text-[#e14b42]',
  }

  const vendorStatusTone = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'active') return 'green'
    if (normalized === 'suspended') return 'red'
    if (normalized === 'draft' || normalized === 'hidden' || normalized === 'inactive') return 'gray'
    if (normalized === 'unavailable') return 'orange'
    if (normalized === 'pending' || normalized.includes('pending')) return 'yellow'
    if (normalized.includes('force')) return 'orange'
    return 'gray'
  }

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">{title}</h2>
        <button
          type="button"
          onClick={() => navigate('/admin/vendors/new')}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
        >
          <Plus size={14} strokeWidth={2.2} /> {action}
        </button>
      </div>

      <ApiErrorBanner error={error} onRetry={refetch} />

      {stats ? (
      <div className="mb-3.5 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
        {stats.map(({ label, value, tone }) => (
          <div
            key={label}
            className="rounded-xl border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
          >
            <p className="text-[12px] text-[#7c8780]">{label}</p>
            <p className={cn('mt-1.5 text-[26px] font-bold leading-none', statTone[tone] || statTone.ink)}>{value}</p>
          </div>
        ))}
      </div>
      ) : (
        <StatCardsSkeleton
          count={4}
          className="mb-3.5 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1"
        />
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                'h-[28px] rounded-[8px] px-3.5 text-[12px]',
                tab === item
                  ? 'bg-white font-bold text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                  : 'font-medium text-[#69756d] hover:text-[#455249]',
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <AdminFilterSelect
          label="Filter by category"
          options={[
            { value: '', label: 'All categories' },
            ...categories.map((item) => ({ value: item, label: item })),
          ]}
          value={category}
          onChange={setCategory}
          className="h-[32px] font-bold text-[#17231c]"
        />
        <label className="flex h-[32px] w-[210px] items-center gap-2 rounded-sm border border-[#e4e8e4] bg-white px-3 shadow-[0_1px_2px_rgba(20,40,28,.04)] max-[700px]:w-full">
          <Search size={14} className="text-[#9aa49d]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent text-[12px] text-[#17231c] outline-none placeholder:text-[#9aa49d]"
            placeholder="Search vendors"
          />
        </label>
      </div>

      <section className="rounded-xl border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0ee]">
                {columns.map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                  >
                    {column}
                  </th>
                ))}
                <th className="w-11" />
              </tr>
            </thead>
            <tbody>
              {showTableSkeleton ? (
                <TableBodySkeleton columns={columns.length + 1} rows={6} />
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-10 text-center text-[13px] text-[#7c8780]"
                  >
                    No vendors found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => openVendor(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openVendor(row.id)
                      }
                    }}
                    className="cursor-pointer border-b border-[#f0f2f0] last:border-0 even:bg-[#fafbfa] hover:bg-[#f6f8f6]"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] font-bold text-[#17231c]">
                      {row.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-[#59655e]">
                        {row.displayCode || row.id}
                        <button
                          type="button"
                          className="text-[#b0b8b2] hover:text-[#59655e]"
                          aria-label={`Copy ${row.displayCode || row.id}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            navigator.clipboard?.writeText(row.displayCode || row.id)
                          }}
                        >
                          <Copy size={12} />
                        </button>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">
                      {row.category}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">
                      {row.orders}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">
                      {row.branches}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">
                      {row.users}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12px] font-medium text-[#17231c]">
                      ★ {row.rating}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 ">
                      <Badge tone={vendorStatusTone(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="px-2">
                      <button
                        type="button"
                        className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
                        aria-label={`Open ${row.name}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          openVendor(row.id)
                        }}
                      >
                        <MoreVertical size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0ee] px-4 py-3">
          <p className="text-[11.5px] text-[#8a948e]">
            Showing {shownFrom}–{shownTo} of {total.toLocaleString()}
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
    </div>
  )
}
