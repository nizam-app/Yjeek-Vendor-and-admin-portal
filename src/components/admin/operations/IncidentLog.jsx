import { ShieldAlert } from 'lucide-react'
import { Badge } from '../Badge'
import { cn } from '../cn'

export function IncidentLog({ incidents, countLabel = '5' }) {
  const priorityTone = {
    P1: 'bg-[#fdebec] text-[#d84245]',
    P2: 'bg-[#fff3d6] text-[#c78a18]',
    P3: 'bg-[#eaf2fb] text-[#3974ad]',
    P4: 'bg-[#f0f2f0] text-[#737d77]',
  }
  return (
    <section className="mt-3 overflow-hidden rounded-lg border border-[#dfe4e0] bg-white">
      <div className="flex h-9 items-center border-b border-[#edf0ee] px-4">
        <ShieldAlert size={12} className="mr-2 text-[#d46763]" /><h3 className="text-[10px] font-bold">Incident log — scheduled</h3>
        <span className="ml-2 rounded-full bg-[#f0f2f0] px-2 text-[9px] text-[#718078]">{countLabel}</span>
        <button className="ml-auto text-[9px] font-medium text-[#16854a]">View all</button>
      </div>
      {incidents.map(({ priority, name, detail, status, time }) => (
        <div key={name} className="flex h-10 items-center border-b border-[#f0f2f0] px-4 last:border-0">
          <span className={cn('mr-3 grid h-[18px] min-w-[22px] place-items-center rounded-[6px] px-1.5 text-[9px] font-medium', priorityTone[priority] || priorityTone.P4)}>{priority}</span>
          <div className="min-w-0 flex-1"><p className="text-[9px] font-medium">{name}</p><p className="truncate text-[9px] text-[#99a09b]">{detail}</p></div>
          <Badge tone={status === 'Open' ? 'red' : 'green'}>{status}</Badge>
          <span className="ml-6 w-10 text-right text-[9px] text-[#929a95]">{time}</span>
        </div>
      ))}
    </section>
  )
}
