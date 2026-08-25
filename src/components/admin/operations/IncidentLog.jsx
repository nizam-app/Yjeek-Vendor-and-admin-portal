import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Badge } from '../Badge'
import { cn } from '../cn'
import { ADMIN_BOARD_PREVIEW_LIMIT } from '../../../lib/adminBoardLimits'

function statusBadgeTone(status) {
  if (status === 'Open') return 'red'
  if (status === 'Pending') return 'yellow'
  if (status === 'Resolved') return 'green'
  return 'gray'
}

/**
 * Scheduled Incident log — preview max 5 rows; View all expands the full list.
 */
export function IncidentLog({
  incidents = [],
  countLabel,
  previewLimit = ADMIN_BOARD_PREVIEW_LIMIT,
  title = 'Incident log — scheduled',
  onIncidentClick,
}) {
  const [showAll, setShowAll] = useState(false)
  const list = Array.isArray(incidents) ? incidents : []
  const label = countLabel ?? String(list.length)
  const visible = showAll ? list : list.slice(0, previewLimit)
  const canExpand = list.length > previewLimit

  const priorityTone = {
    P1: 'bg-[#fdebec] text-[#d84245]',
    P2: 'bg-[#fff3d6] text-[#c78a18]',
    P3: 'bg-[#eaf2fb] text-[#3974ad]',
    P4: 'bg-[#f0f2f0] text-[#737d77]',
  }

  return (
    <section className="mt-3 overflow-hidden rounded-lg border border-[#dfe4e0] bg-white">
      <div className="flex h-9 items-center border-b border-[#edf0ee] px-4">
        <ShieldAlert size={12} className="mr-2 text-[#d46763]" />
        <h3 className="text-[10px] font-bold">{title}</h3>
        <span className="ml-2 rounded-full bg-[#f0f2f0] px-2 text-[9px] text-[#718078]">{label}</span>
        {canExpand ? (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="ml-auto text-[9px] font-medium text-[#16854a] hover:underline"
          >
            {showAll ? 'Show less' : 'View all →'}
          </button>
        ) : (
          <span className="ml-auto text-[9px] font-medium text-[#99a09b]">View all</span>
        )}
      </div>
      {list.length === 0 ? (
        <div className="px-4 py-6 text-center text-[10px] text-[#78837c]">No incidents</div>
      ) : (
        visible.map((incident) => {
          const labelText = incident.name || incident.title || 'Incident'
          return (
            <button
              key={incident.id || `${incident.priority}-${labelText}-${incident.detail}`}
              type="button"
              onClick={() => onIncidentClick?.(incident)}
              className="flex h-10 w-full items-center border-b border-[#f0f2f0] px-4 text-left last:border-0 hover:bg-[#f6f8f6]"
            >
              <span
                className={cn(
                  'mr-3 grid h-[18px] min-w-[22px] place-items-center rounded-[6px] px-1.5 text-[9px] font-medium',
                  priorityTone[incident.priority] || priorityTone.P4,
                )}
              >
                {incident.priority}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-medium">{labelText}</p>
                <p className="truncate text-[9px] text-[#99a09b]">{incident.detail}</p>
              </div>
              {incident.status ? <Badge tone={statusBadgeTone(incident.status)}>{incident.status}</Badge> : null}
              <span className="ml-6 w-10 text-right text-[9px] text-[#929a95]">{incident.time || ''}</span>
            </button>
          )
        })
      )}
    </section>
  )
}
