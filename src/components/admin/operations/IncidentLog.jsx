import { ShieldAlert } from 'lucide-react'
import { Badge } from '../Badge'
import { cn } from '../cn'

function statusBadgeTone(status) {
  if (status === 'Open') return 'red'
  if (status === 'Pending') return 'yellow'
  if (status === 'Resolved') return 'green'
  return 'gray'
}

export function IncidentLog({ incidents = [], countLabel }) {
  const list = Array.isArray(incidents) ? incidents : []
  const label = countLabel ?? String(list.length)
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
        <span className="ml-2 rounded-full bg-[#f0f2f0] px-2 text-[9px] text-[#718078]">{label}</span>
        <button className="ml-auto text-[9px] font-medium text-[#16854a]">View all</button>
      </div>
      {list.length === 0 ? (
        <div className="px-4 py-6 text-center text-[10px] text-[#78837c]">No incidents</div>
      ) : list.map(({ id, priority, name, title, detail, status, time }) => {
        const labelText = name || title || 'Incident'
        return (
          <div key={id || `${priority}-${labelText}-${detail}`} className="flex h-10 items-center border-b border-[#f0f2f0] px-4 last:border-0">
            <span className={cn('mr-3 grid h-[18px] min-w-[22px] place-items-center rounded-[6px] px-1.5 text-[9px] font-medium', priorityTone[priority] || priorityTone.P4)}>{priority}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-medium">{labelText}</p>
              <p className="truncate text-[9px] text-[#99a09b]">{detail}</p>
            </div>
            {status ? <Badge tone={statusBadgeTone(status)}>{status}</Badge> : null}
            <span className="ml-6 w-10 text-right text-[9px] text-[#929a95]">{time || ''}</span>
          </div>
        )
      })}
    </section>
  )
}
