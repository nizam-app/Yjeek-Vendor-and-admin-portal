import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { cn } from '../cn'
import { ADMIN_BOARD_PREVIEW_LIMIT } from '../../../lib/adminBoardLimits'

/**
 * Right-rail Incidents Log (Live / Pickup / Dine-in / Services).
 * Preview max 5; View all expands the list.
 */
export function OpsIncidentsSidebar({
  incidents = [],
  previewLimit = ADMIN_BOARD_PREVIEW_LIMIT,
  title = 'Incidents Log',
}) {
  const [showAll, setShowAll] = useState(false)
  const list = Array.isArray(incidents) ? incidents : []
  const visible = showAll ? list : list.slice(0, previewLimit)
  const canExpand = list.length > previewLimit

  return (
    <aside className="flex h-[441px] flex-col overflow-hidden rounded-xl border border-[#dfe4e0] bg-white px-[14px]">
      <div className="flex h-[43px] shrink-0 items-center gap-1.5">
        <ShieldAlert size={14} className="text-[#d46763]" />
        <h2 className="text-[14px] font-bold text-[#17231c]">{title}</h2>
        {list.length > 0 ? (
          <span className="rounded-full bg-[#f0f2f0] px-2 text-[9px] text-[#718078]">{list.length}</span>
        ) : null}
        {canExpand ? (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="ml-auto text-[9px] font-medium text-[#16854a] hover:underline"
          >
            {showAll ? 'Show less' : 'View all →'}
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-[#78837c]">No incidents</div>
        ) : (
          visible.map(({ id, priority, title: rowTitle, detail, tone }) => (
            <div key={id || `${priority}-${rowTitle}`} className="flex h-[59px] items-center border-b border-[#e2e6e3]">
              <span className={cn(
                'mr-2.5 grid h-[19px] w-8 shrink-0 place-items-center rounded-md text-[9px] font-medium',
                tone === 'red' && 'bg-[#fdebec] text-[#d64044]',
                tone === 'yellow' && 'bg-[#fff4d9] text-[#c78a18]',
                tone === 'blue' && 'bg-[#eaf2fb] text-[#3974ad]',
                tone === 'gray' && 'bg-[#f0f2f0] text-[#737d77]',
                !tone && 'bg-[#fdebec] text-[#d64044]',
              )}>{priority}</span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-[#17231c]">{rowTitle}</p>
                <p className="truncate text-[9px] text-[#818b84]">{detail}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
