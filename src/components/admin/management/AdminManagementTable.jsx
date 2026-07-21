import { useMemo, useState } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../ApiState'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { cn } from '../cn'
import { Toolbar } from '../Toolbar'
import { statusTone } from './statusTone'

export function AdminManagementTable({ type }) {
  const [query, setQuery] = useState('')
  const { data: config, error, isLoading, refetch } = useApiResource(() => adminService.getManagement(type), [type])
  const visibleRows = useMemo(
    () => config?.rows.filter((row) => Array.isArray(row) && row.join(' ').toLowerCase().includes(query.toLowerCase())) || [],
    [config, query],
  )
  if (!config) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  return (
    <div className="p-7 max-[700px]:p-4">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-[20px] font-bold">{config.title}</h2><p className="mt-1 text-[11px] text-[#7c8780]">{config.subtitle}</p></div>
        <Button primary><Plus size={14} /> {config.action}</Button>
      </div>
      <div className="mb-4 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2">
        {config.stats.map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-[#e2e6e3] bg-white p-4">
            <p className="text-[11px] font-medium text-[#7e8982]">{label}</p><p className="mt-1.5 text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <section className="overflow-hidden rounded-lg border border-[#e2e6e3] bg-white">
        <Toolbar placeholder={`Search ${config.title.toLowerCase()}…`} onSearch={setQuery} />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b border-[#e8ebe9] bg-[#fafbfa]">{config.columns.map((column) => <th key={column} className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-[.04em] text-[#78837c]">{column}</th>)}<th /></tr></thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row[0]} className="border-b border-[#eef1ef] last:border-0 hover:bg-[#fafcfa]">
                  {row.map((cell, index) => (
                    <td key={index} className={cn('whitespace-nowrap px-4 py-3 text-[11px]', index === 0 && 'font-medium')}>
                      {index === row.length - 1 ? <Badge tone={statusTone(cell)}>{cell}</Badge> : cell}
                    </td>
                  ))}
                  <td className="px-3"><button className="text-[#7d8781]"><MoreHorizontal size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#e8ebe9] px-4 py-3 text-[10px] text-[#7c8780]">
          <span>Showing {visibleRows.length} of {config.stats[0].value}</span>
          <div className="flex gap-1"><Button className="h-7 px-2">Previous</Button><Button className="h-7 px-2">Next</Button></div>
        </div>
      </section>
    </div>
  )
}
