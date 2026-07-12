import { useState } from 'react'
import { PageHeader, StatusPill } from '../components/ui'
import { staff } from '../data/mockData'

export default function Staff() {
  const [query, setQuery] = useState('')
  const filtered = staff.filter((s) =>
    [s.name, s.email, s.phone, s.branch].join(' ').toLowerCase().includes(query.toLowerCase()),
  )

  const thClass = 'text-left text-[11px] tracking-[0.04em] text-ink-muted font-bold uppercase py-3 px-4 border-b border-border'
  const tdClass = 'py-[14px] px-4 text-[13px] text-ink'

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <PageHeader title="Staff" subtitle="6 branch operators" />

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <input
          className="border border-border rounded-md py-[10px] px-[14px] text-[13px] bg-white min-w-[220px]"
          style={{ flex: 1, minWidth: 280 }}
          placeholder="🔍 Search by name, email or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#fafafa]">
                <th className={thClass}>NAME</th>
                <th className={thClass}>EMAIL</th>
                <th className={thClass}>PHONE</th>
                <th className={thClass}>BRANCH</th>
                <th className={thClass}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const border = idx === filtered.length - 1 ? '' : 'border-b border-border'
                return (
                  <tr key={row.email}>
                    <td className={`${tdClass} ${border} font-bold`}>{row.name}</td>
                    <td className={`${tdClass} ${border} text-ink-muted`}>{row.email}</td>
                    <td className={`${tdClass} ${border}`}>{row.phone}</td>
                    <td className={`${tdClass} ${border}`}>{row.branch}</td>
                    <td className={`${tdClass} ${border}`}>
                      <StatusPill status={row.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
