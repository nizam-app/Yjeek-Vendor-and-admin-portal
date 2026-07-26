import { CalendarDays, ChevronDown, Download, Filter, Search } from 'lucide-react'
import { Button } from './Button'

export function Toolbar({ placeholder = 'Search…', action = 'Export', onSearch }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#e9ecea] bg-white p-3">
      <label className="flex h-[34px] min-w-[230px] flex-1 items-center gap-2 rounded-md border border-[#dfe4e0] px-3">
        <Search size={14} className="text-[#89938c]" />
        <input onChange={(e) => onSearch?.(e.target.value)} className="min-w-0 flex-1 border-0 bg-transparent text-xs outline-none" placeholder={placeholder} />
      </label>
      <Button><Filter size={14} /> Filters</Button>
      <Button><CalendarDays size={14} /> Today ▾</Button>
      <Button><Download size={14} /> {action}</Button>
    </div>
  )
}
