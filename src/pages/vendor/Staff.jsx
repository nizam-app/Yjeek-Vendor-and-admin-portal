import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { PageHeader, StatusPill } from '../../components/ui'
import { useVendorStaff } from '../../hooks/vendor/useVendorStaff'

export default function Staff() {
  const [query, setQuery] = useState('')
  const { data: staff, meta, error, isLoading, refetch } = useVendorStaff()
  const rows = Array.isArray(staff) ? staff : []

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((s) =>
      [s.name, s.email, s.phone, s.branch, s.role].join(' ').toLowerCase().includes(needle),
    )
  }, [rows, query])

  const totalCount = meta?.count ?? rows.length

  const thClass =
    'px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.04em] text-ink-muted uppercase'
  const tdClass = 'px-5 py-[15px] text-[13px] text-ink'

  if (isLoading && rows.length === 0) {
    return <div className="p-7 text-[13px] text-ink-muted">Loading staff…</div>
  }
  if (error && rows.length === 0) {
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load staff.{' '}
        <button type="button" onClick={refetch} className="underline">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="px-[28px] pt-[26px] pb-10">
      <PageHeader
        title="Staff"
        subtitle={`${totalCount} branch operator${totalCount === 1 ? '' : 's'}`}
      />

      <div className="relative mb-4">
        <Search
          size={16}
          strokeWidth={2.2}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint"
        />
        <input
          className="box-border h-[44px] w-full rounded-[12px] border border-[#E0E6E0] bg-white py-2.5 pr-4 pl-10 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-[#1AA34D]"
          placeholder="Search by name, email or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#E0E6E0] bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#E0E6E0] bg-[#F7F8F7]">
                <th className={thClass}>NAME</th>
                <th className={thClass}>EMAIL</th>
                <th className={thClass}>PHONE</th>
                <th className={thClass}>BRANCH</th>
                <th className={thClass}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((row, idx) => (
                  <tr
                    key={row.id || row.email || idx}
                    className={`border-t border-[#EEF1EE] ${
                      idx % 2 === 1 ? 'bg-[#F9FAF9]' : 'bg-white'
                    }`}
                  >
                    <td className={`${tdClass} font-bold`}>{row.name}</td>
                    <td className={`${tdClass} text-ink-muted`}>{row.email}</td>
                    <td className={`${tdClass} text-ink-muted`}>{row.phone}</td>
                    <td className={tdClass}>{row.branch}</td>
                    <td className={tdClass}>
                      <StatusPill status={row.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-ink-muted">
                    {query ? `No staff match “${query}”.` : 'No staff members yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
