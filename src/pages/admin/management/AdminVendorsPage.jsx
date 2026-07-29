import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, MoreVertical, Plus, Search } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { adminVendorService } from '../../../services/admin/vendorService'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { cn } from '../../../components/admin/cn'

export default function AdminVendorsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const { data, error, isLoading, refetch } = useApiResource(
    () =>
      adminVendorService.listVendors({
        search: query,
        status: tab,
        category,
        limit: 20,
      }),
    [tab, query, category],
  )

  const rows = useMemo(() => {
    if (!data?.rows) return []
    // Real API already filters; this also covers mock management fallback.
    return data.rows.filter((row) => {
      const status = String(row.status || '')
      const matchesTab =
        tab === 'All' ||
        (tab === 'Pending'
          ? /pending|draft/i.test(status)
          : status.toLowerCase() === tab.toLowerCase())
      const matchesCategory = !category || row.category === category
      const haystack = `${row.name} ${row.displayCode || ''} ${row.id} ${row.category} ${status}`.toLowerCase()
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase())
      return matchesTab && matchesCategory && matchesQuery
    })
  }, [data, tab, query, category])

  const categories = useMemo(() => {
    const set = new Set()
    ;(data?.rows || []).forEach((row) => {
      if (row.category && row.category !== '—') set.add(row.category)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [data])

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

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
    if (normalized === 'pending' || normalized.includes('pending')) return 'yellow'
    return 'gray'
  }

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">{data.title}</h2>
        <button
          type="button"
          onClick={() => navigate('/admin/vendors/new')}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
        >
          <Plus size={14} strokeWidth={2.2} /> {data.action}
        </button>
      </div>

      <div className="mb-3.5 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
        {data.stats.map(({ label, value, tone }) => (
          <div
            key={label}
            className="rounded-xl border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
          >
            <p className="text-[12px] text-[#7c8780]">{label}</p>
            <p className={cn('mt-1.5 text-[26px] font-bold leading-none', statTone[tone] || statTone.ink)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
          {data.tabs.map((item) => (
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
        <label className="relative inline-flex h-[32px] items-center">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-[32px] appearance-none rounded-full border border-[#e4e8e4] bg-white py-0 pl-3.5 pr-8 text-[12px] font-bold text-[#17231c] shadow-[0_1px_2px_rgba(20,40,28,.04)] outline-none hover:bg-[#fafbfa]"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 text-[10px] text-[#69756d]">▾</span>
        </label>
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
                {data.columns.map((column) => (
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
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={data.columns.length + 1}
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
      </section>
    </div>
  )
}
