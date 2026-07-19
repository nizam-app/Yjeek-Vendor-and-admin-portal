import { useState } from 'react'
import { Search } from 'lucide-react'
import { PageHeader, StatusPill } from '../components/ui'
import { useApiResource } from '../hooks/useApiResource'
import { vendorService } from '../services/vendorService'

export default function Staff() {
  const [query, setQuery] = useState('')
  const { data: staff, error, isLoading, refetch } = useApiResource(() => vendorService.getStaff(), [])
  const filtered = (staff || []).filter((s) =>
    [s.name, s.email, s.phone, s.branch].join(' ').toLowerCase().includes(query.toLowerCase()),
  )

  const thClass =
    'px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.04em] text-ink-muted uppercase'
  const tdClass = 'px-5 py-[15px] text-[13px] text-ink'
  if (isLoading) return <div className="p-7 text-[13px] text-ink-muted">Loading staff…</div>
  if (error) return <div className="p-7 text-[13px] text-danger">Unable to load staff. <button onClick={refetch} className="underline">Try again</button></div>

  return (
    <div className="px-[28px] pt-[26px] pb-10">
      <PageHeader title="Staff" subtitle={`${staff.length} branch operators`} />

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
              {filtered.map((row, idx) => (
                <tr
                  key={row.email}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
