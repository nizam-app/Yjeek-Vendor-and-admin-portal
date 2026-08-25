import { ShieldAlert } from 'lucide-react'
import { cn } from '../cn'

function incidentTone(incident) {
  return incident?.tone || 'red'
}

function incidentSubtitle(incident) {
  if (incident?.detail) return String(incident.detail)
  const id = incident?.orderNumber ? `#${incident.orderNumber}` : (incident?.id ? `#${incident.id}` : '')
  const status = incident?.status ? String(incident.status).toLowerCase() : ''
  return [id, status].filter(Boolean).join(' · ')
}

/**
 * Shared Incidents Log for Live Orders, Pickup, Dine-in, Services, and Dashboard.
 * Same card: P1 badge, title, `#order · status`, internal scroll, clickable rows.
 */
export function OpsIncidentsSidebar({
  incidents = [],
  title = 'Incidents Log',
  onIncidentClick,
  fillHeight = true,
}) {
  const list = Array.isArray(incidents) ? incidents : []

  return (
    <aside
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-[#dfe4e0] bg-white px-[14px] shadow-[0_1px_2px_rgba(20,40,28,.025)]',
        fillHeight ? 'h-full min-h-0 self-stretch' : 'h-[360px]',
      )}
    >
      <div className="flex h-[44px] shrink-0 items-center gap-1.5">
        <ShieldAlert size={14} strokeWidth={2} className="text-[#d46763]" />
        <h2 className="text-[14px] font-bold text-[#17231c]">{title}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="px-0.5 py-8 text-center text-[12px] text-[#78837c]">No incidents</div>
        ) : (
          list.map((incident) => {
            const tone = incidentTone(incident)
            return (
              <button
                key={incident.id || `${incident.priority}-${incident.title}`}
                type="button"
                onClick={() => onIncidentClick?.(incident)}
                className="flex h-[63px] w-full items-center border-b border-[#e2e6e3] px-0.5 text-left hover:bg-[#f6f8f6]"
              >
                <span
                  className={cn(
                    'mr-2.5 grid h-[19px] w-8 shrink-0 place-items-center rounded-md text-[10px] font-medium',
                    tone === 'red' && 'bg-[#fdebec] text-[#d64044]',
                    tone === 'yellow' && 'bg-[#fff4d9] text-[#c78a18]',
                    tone === 'blue' && 'bg-[#eaf2fb] text-[#3974ad]',
                    tone === 'gray' && 'bg-[#f0f2f0] text-[#737d77]',
                  )}
                >
                  {incident.priority || 'P1'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold leading-[15px] text-[#202722]">
                    {incident.title || incident.name || 'Incident'}
                  </p>
                  <p className="truncate text-[10px] font-normal leading-[14px] text-[#77827b]">
                    {incidentSubtitle(incident)}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}
